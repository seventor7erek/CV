# Phase 3: Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add bit-depth selector, batch conversion, audio preview, and PWA/offline support to the mp3towav converter.

**Architecture:** Incremental enhancement to the existing vanilla JS/HTML/CSS codebase. No framework, no build system. Each feature layers onto the existing `app.js` (336 lines), `index.html`, and `style.css`. The Sonic Converter WASM already supports `convertMp3ToWavWithDepth(data, 16|24|32)` and `getMp3Info(data)` — we just need to wire them up.

**Tech Stack:** Vanilla JS, HTML5 Audio API, JSZip (CDN), Service Worker API

---

## Context for Implementer

**Key files:**
- `index.html` — Homepage with converter UI. Drop zone at lines 163-211, file input at line 212, trust line at line 213.
- `app.js` — All converter logic (336 lines). State at lines 10-15, DOM refs at lines 17-33, WASM init at lines 35-56, file handling at lines 132-143, conversion at lines 198-281, reset at lines 302-314.
- `style.css` — All styles (813 lines). Drop zone styles at lines 140-190, done state at lines 339-365, buttons at lines 440-488, responsive at lines 754-813.
- `sonic-converter/src/wasm/mod.rs` — WASM bindings. `convertMp3ToWav` (line 18), `convertMp3ToWavWithDepth` (line 26), `getMp3Info` (line 55).

**Current converter flow:**
1. User drops/selects ONE MP3 file
2. `handleFile()` validates (MP3 type, <100MB)
3. `convertFile()` reads as ArrayBuffer, calls `wasmModule.convertMp3ToWav(mp3Bytes)` (always 16-bit)
4. Creates blob URL, shows done state with file comparison and download button
5. `reset()` cleans up blob URL and returns to idle state

**Testing approach:** No test framework. Verify by running `python server.py` (port 3000) and checking the browser. Use preview tools for snapshots and eval.

---

## Task 1: Bit-Depth Selector

**Files:**
- Modify: `index.html:212-213` (add selector between file input and trust line)
- Modify: `style.css` (add selector styles after line 488)
- Modify: `app.js:10-15` (add state), `app.js:17-33` (add DOM ref), `app.js:225` (use depth)

### Step 1: Add HTML for bit-depth selector

In `index.html`, between the closing `</div>` of the drop zone (line 211) and the `<input type="file">` (line 212), add:

```html
                <div class="bit-depth-selector" id="bitDepthSelector">
                    <span class="bit-depth-label">Output quality</span>
                    <div class="bit-depth-options">
                        <button type="button" class="bit-depth-btn active" data-depth="16">16-bit</button>
                        <button type="button" class="bit-depth-btn" data-depth="24">24-bit</button>
                        <button type="button" class="bit-depth-btn" data-depth="32">32-bit</button>
                    </div>
                </div>
```

Place it AFTER the `<input type="file">` line and BEFORE the trust line `<p class="trust-line">`.

### Step 2: Add CSS for bit-depth selector

In `style.css`, add after the button styles (after line 488, before the Footer section):

```css
/* ---- Bit Depth Selector ---- */
.bit-depth-selector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1rem;
    margin-bottom: 0.25rem;
}

.bit-depth-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
}

.bit-depth-options {
    display: flex;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
}

.bit-depth-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 500;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.bit-depth-btn:hover {
    color: var(--text);
}

.bit-depth-btn.active {
    background: var(--primary);
    color: #fff;
}

.bit-depth-btn + .bit-depth-btn {
    border-left: 1px solid var(--border);
}
```

### Step 3: Wire up bit-depth in app.js

Add to state section (after line 15):
```js
let selectedBitDepth = 16;
```

Add to DOM section (after line 33):
```js
const bitDepthSelector = document.getElementById('bitDepthSelector');
```

Add event listener (after the retryBtn listener, around line 125):
```js
// --- Bit Depth Selector ---
bitDepthSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.bit-depth-btn');
    if (!btn) return;
    bitDepthSelector.querySelectorAll('.bit-depth-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedBitDepth = parseInt(btn.dataset.depth, 10);
});
```

In `convertFile()`, change line 225 from:
```js
            const wavBytes = wasmModule.convertMp3ToWav(mp3Bytes);
```
to:
```js
            const wavBytes = wasmModule.convertMp3ToWavWithDepth(mp3Bytes, selectedBitDepth);
```

In the done state file comparison (around line 271), change the output size line to include bit depth:
```js
                <span class="file-size">${formatSize(blob.size)} · ${selectedBitDepth}-bit</span>
```

In the Web Audio fallback path (around line 230-243), add a warning if user selected non-16-bit:
```js
            // Fallback: Web Audio API
            if (selectedBitDepth !== 16) {
                console.warn('Web Audio fallback only supports 16-bit. Using 16-bit output.');
            }
            progressText.textContent = 'Converting (Web Audio)...';
```

### Step 4: Verify

Start server: `python server.py`
- [ ] Segmented control visible below drop zone, 16-bit selected by default
- [ ] Clicking 24-bit/32-bit changes active state (orange highlight moves)
- [ ] Convert an MP3 — done screen shows "· 16-bit" next to output size
- [ ] Select 24-bit, convert again — output file is larger, shows "· 24-bit"
- [ ] Select 32-bit, convert again — output file is even larger, shows "· 32-bit"

### Step 5: Commit

```bash
git add index.html style.css app.js
git commit -m "feat: add bit-depth selector (16/24/32-bit WAV output)"
```

---

## Task 2: Batch Conversion

This is the largest task. It modifies the converter to accept multiple files and process them sequentially.

**Files:**
- Modify: `index.html` (add queue panel, JSZip script, change file input to multiple)
- Modify: `style.css` (add queue styles)
- Modify: `app.js` (add queue logic, batch processing, ZIP download)

### Step 1: Add JSZip and update file input in index.html

Change the file input (line 212) to allow multiple:
```html
                <input type="file" id="fileInput" accept=".mp3,audio/mpeg" multiple hidden>
```

Add JSZip CDN before the app.js script tag (before line 364):
```html
    <script src="https://cdn.jsdelivr.net/npm/jszip@3/dist/jszip.min.js" defer></script>
```

### Step 2: Add batch queue HTML panel in index.html

Inside the drop zone div (after the Error State div, before the closing `</div>` of dropZone), add:

```html
                    <!-- Batch State -->
                    <div class="drop-zone-batch hidden" id="dzBatch">
                        <p class="batch-title">Converting <span id="batchCount">0</span> files</p>
                        <div class="batch-queue" id="batchQueue"></div>
                        <div class="batch-actions hidden" id="batchActions">
                            <button type="button" class="btn-primary" id="downloadAllBtn">Download All as ZIP</button>
                            <button type="button" class="btn-secondary" id="batchResetBtn">Convert more files</button>
                        </div>
                    </div>
```

### Step 3: Add batch queue CSS in style.css

Add after the bit-depth selector styles:

```css
/* ---- Batch Queue ---- */
.batch-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.batch-queue {
    width: 100%;
    max-width: 420px;
    margin: 0 auto 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
}

.batch-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
}

.batch-item-status {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
}

.batch-item-status.waiting { color: var(--text-muted); }
.batch-item-status.converting { color: var(--primary); }
.batch-item-status.done { color: var(--success); }
.batch-item-status.error { color: var(--error); }

.batch-item-name {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.batch-item-info {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--text-muted);
    white-space: nowrap;
}

.batch-item-play {
    background: none;
    border: 1px solid var(--border);
    color: var(--text-muted);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    transition: border-color 0.2s, color 0.2s;
    padding: 0;
    flex-shrink: 0;
}

.batch-item-play:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.batch-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
}

@keyframes batch-spin {
    to { transform: rotate(360deg); }
}

.batch-item-status.converting::after {
    content: '';
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: batch-spin 0.8s linear infinite;
}
```

### Step 4: Rewrite app.js for batch support

This is the biggest change. The key principle: **if 1 file is dropped, use the existing single-file flow. If multiple files are dropped, use the batch flow.**

Add to state section:
```js
let batchResults = []; // { file, blobUrl, outputName, size, error }
let batchAudio = null; // currently playing audio in batch mode
```

Add to DOM section:
```js
const dzBatch = document.getElementById('dzBatch');
const batchCount = document.getElementById('batchCount');
const batchQueue = document.getElementById('batchQueue');
const batchActions = document.getElementById('batchActions');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const batchResetBtn = document.getElementById('batchResetBtn');
```

Update `showPanel` to include dzBatch:
```js
function showPanel(panel) {
    [dzIdle, dzLoading, dzConverting, dzDone, dzError, dzBatch].forEach(p => {
        p.classList.add('hidden');
    });
    panel.classList.remove('hidden');
}
```

Change the drag-and-drop handler to accept multiple files:
```js
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (isProcessing) return;
    const files = Array.from(e.dataTransfer.files).filter(f =>
        f.name.toLowerCase().endsWith('.mp3') || f.type === 'audio/mpeg'
    );
    if (files.length === 0) {
        showError("No MP3 files found. Please drop valid .mp3 files.");
        return;
    }
    if (files.length === 1) {
        handleFile(files[0]);
    } else {
        handleBatch(files);
    }
});
```

Update `fileInput.addEventListener('change')`:
```js
fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files).filter(f =>
        f.name.toLowerCase().endsWith('.mp3') || f.type === 'audio/mpeg'
    );
    if (files.length === 1) {
        handleFile(files[0]);
    } else if (files.length > 1) {
        handleBatch(files);
    }
});
```

Add the batch processing functions:
```js
// --- Batch Conversion ---
async function handleBatch(files) {
    // Validate all files
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
        showError(`${oversized.length} file(s) exceed the 100 MB limit.`);
        return;
    }

    isProcessing = true;
    batchResults = [];
    dropZone.classList.remove('done', 'error');
    showPanel(dzBatch);
    batchCount.textContent = files.length;
    batchActions.classList.add('hidden');

    // Build queue UI
    batchQueue.innerHTML = files.map((f, i) => `
        <div class="batch-item" data-index="${i}">
            <span class="batch-item-status waiting">&#9679;</span>
            <span class="batch-item-name">${escapeHtml(f.name)}</span>
            <span class="batch-item-info">${formatSize(f.size)}</span>
        </div>
    `).join('');

    // Process sequentially
    await wasmInit;

    for (let i = 0; i < files.length; i++) {
        const item = batchQueue.querySelector(`[data-index="${i}"]`);
        const statusEl = item.querySelector('.batch-item-status');
        const infoEl = item.querySelector('.batch-item-info');

        // Mark converting
        statusEl.className = 'batch-item-status converting';
        statusEl.innerHTML = '';

        try {
            const arrayBuffer = await files[i].arrayBuffer();
            const mp3Bytes = new Uint8Array(arrayBuffer);
            let wavBuffer;

            if (wasmReady) {
                wavBuffer = wasmModule.convertMp3ToWavWithDepth(mp3Bytes, selectedBitDepth).buffer;
            } else {
                if (selectedBitDepth !== 16) {
                    console.warn('Web Audio fallback only supports 16-bit.');
                }
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
                await audioCtx.close();
                wavBuffer = encodeWAV(audioBuffer);
            }

            const outputName = files[i].name.replace(/\.mp3$/i, '.wav');
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            const blobUrl = URL.createObjectURL(blob);

            batchResults.push({ file: files[i], blobUrl, outputName, size: blob.size, error: null });

            // Mark done
            statusEl.className = 'batch-item-status done';
            statusEl.innerHTML = '&#10003;';
            infoEl.textContent = `${formatSize(blob.size)} · ${selectedBitDepth}-bit`;

            // Add play + download buttons
            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'batch-item-play';
            playBtn.innerHTML = '&#9654;';
            playBtn.title = 'Preview';
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBatchAudio(blobUrl, playBtn);
            });
            item.appendChild(playBtn);

        } catch (err) {
            console.error(`Batch conversion failed for ${files[i].name}:`, err);
            batchResults.push({ file: files[i], blobUrl: null, outputName: null, size: 0, error: err.message });
            statusEl.className = 'batch-item-status error';
            statusEl.innerHTML = '&#10007;';
            infoEl.textContent = 'Failed';
        }
    }

    // Show batch actions
    dropZone.classList.add('done');
    batchActions.classList.remove('hidden');
    const successCount = batchResults.filter(r => !r.error).length;
    batchCount.textContent = `${successCount}/${files.length}`;
    isProcessing = false;
}

function toggleBatchAudio(blobUrl, btn) {
    if (batchAudio && !batchAudio.paused) {
        batchAudio.pause();
        batchAudio.currentTime = 0;
        // Reset all play buttons
        batchQueue.querySelectorAll('.batch-item-play').forEach(b => { b.innerHTML = '&#9654;'; });
        if (batchAudio._blobUrl === blobUrl) {
            batchAudio = null;
            return;
        }
    }
    batchAudio = new Audio(blobUrl);
    batchAudio._blobUrl = blobUrl;
    batchAudio.play();
    btn.innerHTML = '&#9646;&#9646;';
    batchAudio.addEventListener('ended', () => {
        btn.innerHTML = '&#9654;';
        batchAudio = null;
    });
}
```

Add event listeners for batch buttons:
```js
downloadAllBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const successResults = batchResults.filter(r => !r.error);
    if (successResults.length === 0) return;

    if (successResults.length === 1) {
        triggerDownload(successResults[0].blobUrl, successResults[0].outputName);
        return;
    }

    // ZIP download
    downloadAllBtn.textContent = 'Creating ZIP...';
    downloadAllBtn.disabled = true;

    try {
        const zip = new JSZip();
        for (const result of successResults) {
            const response = await fetch(result.blobUrl);
            const blob = await response.blob();
            zip.file(result.outputName, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        triggerDownload(zipUrl, 'mp3towav-converted.zip');
        URL.revokeObjectURL(zipUrl);
    } catch (err) {
        console.error('ZIP creation failed:', err);
    } finally {
        downloadAllBtn.textContent = 'Download All as ZIP';
        downloadAllBtn.disabled = false;
    }
});

batchResetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Clean up batch blob URLs
    batchResults.forEach(r => {
        if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
    });
    batchResults = [];
    if (batchAudio) {
        batchAudio.pause();
        batchAudio = null;
    }
    reset();
});
```

Update the `reset()` function to also clean batch state:
```js
function reset() {
    if (lastBlobUrl) {
        URL.revokeObjectURL(lastBlobUrl);
        lastBlobUrl = null;
    }
    batchResults.forEach(r => {
        if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
    });
    batchResults = [];
    if (batchAudio) {
        batchAudio.pause();
        batchAudio = null;
    }
    lastFileName = null;
    fileInput.value = '';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    dropZone.classList.remove('done', 'error', 'dragover');
    isProcessing = false;
    showPanel(dzIdle);
}
```

Update the `beforeunload` handler to clean batch URLs:
```js
window.addEventListener('beforeunload', () => {
    if (lastBlobUrl) {
        URL.revokeObjectURL(lastBlobUrl);
        lastBlobUrl = null;
    }
    batchResults.forEach(r => {
        if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
    });
});
```

Also update the idle-state drop text to hint at multiple files. In `index.html`, change:
```html
                        <p class="drop-text">Drop your MP3 here</p>
```
to:
```html
                        <p class="drop-text">Drop your MP3 files here</p>
```

### Step 5: Verify

- [ ] Drop 1 MP3 file — existing single-file flow works exactly as before
- [ ] Drop 3 MP3 files — batch queue appears with file list
- [ ] Files process one at a time with spinner → checkmark
- [ ] After all complete, "Download All as ZIP" and "Convert more files" buttons appear
- [ ] ZIP download works (contains all WAV files)
- [ ] Play buttons appear on completed items and toggle audio
- [ ] "Convert more files" resets to idle
- [ ] Browse button → select multiple files → batch flow works

### Step 6: Commit

```bash
git add index.html style.css app.js
git commit -m "feat: add batch conversion with queue UI and ZIP download"
```

---

## Task 3: Audio Preview (Single-File Mode)

**Files:**
- Modify: `index.html` (add preview button to done state)
- Modify: `style.css` (add preview button styles)
- Modify: `app.js` (add play/pause logic)

### Step 1: Add preview button HTML

In `index.html`, in the done state div, add a preview button BEFORE the download button:

Change:
```html
                        <button type="button" class="btn-primary" id="downloadBtn">Download WAV</button>
                        <button type="button" class="btn-secondary" id="convertAnotherBtn">Convert another file</button>
```
to:
```html
                        <div class="done-buttons">
                            <button type="button" class="btn-preview" id="previewBtn" title="Preview audio">&#9654; Preview</button>
                            <button type="button" class="btn-primary" id="downloadBtn">Download WAV</button>
                        </div>
                        <button type="button" class="btn-secondary" id="convertAnotherBtn">Convert another file</button>
```

### Step 2: Add preview button CSS

In `style.css`:
```css
/* ---- Audio Preview Button ---- */
.done-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin-bottom: 0.75rem;
}

.done-buttons .btn-primary {
    margin-bottom: 0;
}

.btn-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.75rem 1.25rem;
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-family: var(--font-main);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.btn-preview:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-glow);
}

.btn-preview.playing {
    border-color: var(--primary);
    color: var(--primary);
}
```

### Step 3: Add preview logic in app.js

Add to state:
```js
let previewAudio = null;
```

Add to DOM refs:
```js
const previewBtn = document.getElementById('previewBtn');
```

Add event listener:
```js
// --- Audio Preview ---
previewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (previewAudio && !previewAudio.paused) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        previewBtn.innerHTML = '&#9654; Preview';
        previewBtn.classList.remove('playing');
        previewAudio = null;
        return;
    }
    if (!lastBlobUrl) return;
    previewAudio = new Audio(lastBlobUrl);
    previewAudio.play();
    previewBtn.innerHTML = '&#9646;&#9646; Stop';
    previewBtn.classList.add('playing');
    previewAudio.addEventListener('ended', () => {
        previewBtn.innerHTML = '&#9654; Preview';
        previewBtn.classList.remove('playing');
        previewAudio = null;
    });
});
```

Update `reset()` to stop preview audio:
```js
    if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
    }
```

### Step 4: Verify

- [ ] Convert a file — preview button appears next to download button
- [ ] Click Preview — audio plays, button changes to "Stop"
- [ ] Click Stop — audio stops, button returns to "Preview"
- [ ] Audio plays to end — button auto-resets to "Preview"
- [ ] Click "Convert another file" — audio stops, returns to idle

### Step 5: Commit

```bash
git add index.html style.css app.js
git commit -m "feat: add audio preview on conversion done screen"
```

---

## Task 4: PWA / Service Worker

**Files:**
- Create: `manifest.json`
- Create: `sw.js`
- Modify: `index.html` (add manifest link + SW registration)

### Step 1: Create manifest.json

Create `manifest.json` in the project root:

```json
{
    "name": "mp3towav — Free MP3 to WAV Converter",
    "short_name": "mp3towav",
    "description": "Convert MP3 to WAV instantly in your browser. Files never leave your device.",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#09090b",
    "theme_color": "#09090b",
    "icons": [
        {
            "src": "/apple-touch-icon.png",
            "sizes": "180x180",
            "type": "image/png"
        },
        {
            "src": "/og-image.png",
            "sizes": "1200x630",
            "type": "image/png",
            "purpose": "any"
        }
    ]
}
```

### Step 2: Create sw.js

Create `sw.js` in the project root:

```js
const CACHE_NAME = 'mp3towav-v1';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/sonic_converter.js',
    '/sonic_converter_bg.wasm',
    '/manifest.json'
];

// Install: precache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for HTML
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (analytics, CDN scripts)
    if (url.origin !== self.location.origin) return;

    // HTML pages: network-first
    if (event.request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            });
        })
    );
});
```

### Step 3: Add manifest link and SW registration to index.html

In the `<head>`, after the apple-touch-icon link (around line 26), add:
```html
    <link rel="manifest" href="/manifest.json">
```

Before the closing `</body>` tag, after the app.js script, add:
```html
    <script>
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        });
    }
    </script>
```

### Step 4: Verify

- [ ] Page loads without errors
- [ ] In Chrome DevTools > Application > Manifest: manifest loads correctly
- [ ] In Chrome DevTools > Application > Service Workers: SW is registered and active
- [ ] In Chrome DevTools > Application > Cache Storage: `mp3towav-v1` cache exists with assets
- [ ] Go offline (DevTools > Network > Offline): homepage still loads and converter works
- [ ] Chrome shows "Install" option in address bar

### Step 5: Commit

```bash
git add manifest.json sw.js index.html
git commit -m "feat: add PWA support with service worker for offline conversion"
```

---

## Task 5: Final Verification & Push

### Step 1: Full regression test

- [ ] Single file conversion works (all 3 bit depths)
- [ ] Batch conversion works (drop multiple files)
- [ ] ZIP download works
- [ ] Audio preview works (single + batch)
- [ ] PWA installs and works offline
- [ ] Existing pages (blog, FAQ, about, alternatives) still load correctly
- [ ] No console errors

### Step 2: Push

```bash
git push origin master
```
