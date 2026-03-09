# Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Privacy Policy, Terms of Service, fix Schema.org, add Plausible analytics, update sitemap — all additive, zero risk to converter.

**Architecture:** New static HTML pages reusing existing content.css styles. Plausible analytics via single script tag on all pages. Schema fix is a targeted deletion in index.html.

**Tech Stack:** HTML, CSS (existing content.css), Plausible.io (external script)

---

### Task 1: Create Privacy Policy page

**Files:**
- Create: `privacy/index.html`

**Step 1: Create directory**

```bash
mkdir -p privacy
```

**Step 2: Create privacy/index.html**

Create the file with this exact content — matches the existing page structure from faq/index.html and blog posts (same head pattern, nav, footer, content.css):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy — mp3towav.online</title>
    <meta name="description" content="mp3towav.online privacy policy. Your files never leave your device. No tracking cookies, no file uploads, no data collection. 100% browser-based audio conversion.">
    <meta property="og:title" content="Privacy Policy — mp3towav.online">
    <meta property="og:description" content="Your files never leave your device. No tracking cookies, no file uploads, no data collection.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mp3towav.online/privacy/">
    <meta property="og:image" content="https://mp3towav.online/og-image.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://mp3towav.online/og-image.png">
    <link rel="canonical" href="https://mp3towav.online/privacy/">
    <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" crossorigin>
    <link rel="stylesheet" href="/content.css">

    <!-- Plausible Analytics -->
    <script defer data-domain="mp3towav.online" src="https://plausible.io/js/script.js"></script>
</head>
<body>
    <header>
        <nav class="site-nav">
            <a href="/" class="nav-logo">mp3towav<span>.online</span></a>
            <div class="nav-links">
                <a href="/">Converter</a>
                <a href="/blog/">Blog</a>
                <a href="/faq/">FAQ</a>
                <a href="/api/">API</a>
            </div>
        </nav>
    </header>

    <main>
        <article class="article">
            <div class="container">
                <h1>Privacy Policy</h1>
                <p><strong>Last updated:</strong> March 9, 2026</p>

                <h2>The Short Version</h2>
                <p>mp3towav.online is built on a simple principle: your files are yours. When you convert an MP3 to WAV using our browser-based converter, your audio file never leaves your device. We don't upload it, we don't store it, and we don't have access to it.</p>

                <h2>How the Converter Works</h2>
                <p>Our converter runs entirely in your web browser using WebAssembly (Wasm) technology. When you drop an MP3 file onto the converter:</p>
                <ul>
                    <li>The file is read by your browser's JavaScript engine</li>
                    <li>The Sonic Converter WebAssembly module decodes the MP3 and encodes a WAV file</li>
                    <li>The WAV file is created in your browser's memory</li>
                    <li>You download the result directly to your device</li>
                </ul>
                <p>At no point does your audio file leave your device or touch our servers. You can verify this by monitoring your browser's network tab during conversion — no upload requests are made.</p>

                <h2>Data We Do Not Collect</h2>
                <ul>
                    <li>We do not collect, store, or process your audio files</li>
                    <li>We do not use tracking cookies</li>
                    <li>We do not use fingerprinting or cross-site tracking</li>
                    <li>We do not sell or share any user data</li>
                    <li>We do not require account creation or login</li>
                </ul>

                <h2>Analytics</h2>
                <p>We use <a href="https://plausible.io" rel="noopener noreferrer" target="_blank">Plausible Analytics</a>, a privacy-friendly analytics tool that does not use cookies and does not collect personal data. Plausible collects only aggregate, anonymous usage data such as page views, referral sources, and browser type. No individual user can be identified. Plausible is open source, hosted in the EU, and fully GDPR compliant.</p>

                <h2>Sonic Converter API</h2>
                <p>If you use the <a href="/api/">Sonic Converter API</a> (our paid server-side conversion service), your audio file is uploaded to our API server for processing. In this case:</p>
                <ul>
                    <li>Files are written to a temporary location during conversion</li>
                    <li>Temporary files are deleted immediately after the conversion response is sent</li>
                    <li>No audio files are stored, cached, or retained after processing</li>
                    <li>API requests are authenticated with your API key</li>
                    <li>We do not log the contents of uploaded files</li>
                </ul>

                <h2>Third-Party Services</h2>
                <ul>
                    <li><strong>Vercel</strong> — Hosts the static website. <a href="https://vercel.com/legal/privacy-policy" rel="noopener noreferrer" target="_blank">Vercel Privacy Policy</a></li>
                    <li><strong>Google Fonts</strong> — Serves the Space Grotesk and JetBrains Mono typefaces. <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Google Privacy Policy</a></li>
                    <li><strong>Plausible Analytics</strong> — Privacy-friendly, cookie-free analytics. <a href="https://plausible.io/privacy" rel="noopener noreferrer" target="_blank">Plausible Privacy Policy</a></li>
                    <li><strong>Gumroad</strong> — Processes API subscription payments. <a href="https://gumroad.com/privacy" rel="noopener noreferrer" target="_blank">Gumroad Privacy Policy</a></li>
                </ul>

                <h2>Children's Privacy</h2>
                <p>mp3towav.online is not directed at children under 13. We do not knowingly collect any personal information from children.</p>

                <h2>Changes to This Policy</h2>
                <p>We may update this policy from time to time. Changes will be posted on this page with an updated date.</p>

                <h2>Contact</h2>
                <p>If you have questions about this privacy policy, contact us at <a href="mailto:privacy@mp3towav.online">privacy@mp3towav.online</a>.</p>
            </div>
        </article>
    </main>

    <footer>
        <div class="container">
            <div class="footer-links">
                <a href="/">MP3 to WAV Converter</a>
                <a href="/blog/">Blog</a>
                <a href="/faq/">FAQ</a>
                <a href="/api/">API</a>
                <a href="/privacy/">Privacy</a>
                <a href="/terms/">Terms</a>
            </div>
            <p>&copy; 2026 mp3towav.online — Free, private MP3 to WAV conversion.</p>
        </div>
    </footer>
</body>
</html>
```

**Step 3: Verify the file renders**

Open `privacy/index.html` in browser and confirm it matches the site's dark theme and layout.

---

### Task 2: Create Terms of Service page

**Files:**
- Create: `terms/index.html`

**Step 1: Create directory**

```bash
mkdir -p terms
```

**Step 2: Create terms/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service — mp3towav.online</title>
    <meta name="description" content="Terms of service for mp3towav.online — free browser-based MP3 to WAV converter and the Sonic Converter API.">
    <meta property="og:title" content="Terms of Service — mp3towav.online">
    <meta property="og:description" content="Terms of service for mp3towav.online and the Sonic Converter API.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://mp3towav.online/terms/">
    <meta property="og:image" content="https://mp3towav.online/og-image.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:image" content="https://mp3towav.online/og-image.png">
    <link rel="canonical" href="https://mp3towav.online/terms/">
    <link rel="icon" type="image/svg+xml" href="/public/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" crossorigin>
    <link rel="stylesheet" href="/content.css">

    <!-- Plausible Analytics -->
    <script defer data-domain="mp3towav.online" src="https://plausible.io/js/script.js"></script>
</head>
<body>
    <header>
        <nav class="site-nav">
            <a href="/" class="nav-logo">mp3towav<span>.online</span></a>
            <div class="nav-links">
                <a href="/">Converter</a>
                <a href="/blog/">Blog</a>
                <a href="/faq/">FAQ</a>
                <a href="/api/">API</a>
            </div>
        </nav>
    </header>

    <main>
        <article class="article">
            <div class="container">
                <h1>Terms of Service</h1>
                <p><strong>Effective date:</strong> March 9, 2026</p>

                <h2>1. Service Description</h2>
                <p>mp3towav.online provides a free, browser-based MP3 to WAV audio converter. The conversion runs entirely in your web browser using WebAssembly technology. We also offer the Sonic Converter API, a paid server-side conversion service for developers and businesses.</p>

                <h2>2. Free Converter</h2>
                <p>The browser-based converter is provided free of charge with no account required. You may use it for personal or commercial purposes. Files are processed locally on your device and are never uploaded to our servers.</p>

                <h2>3. Sonic Converter API</h2>
                <p>The API is available in tiered plans (Free, Pro, Business, Unlimited). By subscribing to a paid plan, you agree to the following:</p>
                <ul>
                    <li>API keys are personal and must not be shared or redistributed</li>
                    <li>Usage is subject to the rate limits and file size limits of your plan</li>
                    <li>Subscriptions are billed monthly through Gumroad</li>
                    <li>You may cancel your subscription at any time through Gumroad</li>
                </ul>

                <h2>4. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the service to convert files you do not have the right to process</li>
                    <li>Attempt to reverse-engineer, decompile, or extract the source code of the WebAssembly module</li>
                    <li>Use automated tools to abuse the API beyond your plan's rate limits</li>
                    <li>Redistribute the API service or resell access to it</li>
                    <li>Use the service for any unlawful purpose</li>
                </ul>

                <h2>5. Intellectual Property</h2>
                <p>You retain all rights to the audio files you convert. mp3towav.online does not claim any ownership or license over your content. The mp3towav.online website, Sonic Converter engine, and associated code are the intellectual property of mp3towav.online.</p>

                <h2>6. No Warranty</h2>
                <p>The service is provided "as is" without warranty of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that converted files will meet specific quality requirements. Audio quality after conversion depends on the quality of the original MP3 file.</p>

                <h2>7. Limitation of Liability</h2>
                <p>To the maximum extent permitted by law, mp3towav.online shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to loss of data, loss of revenue, or loss of audio files.</p>

                <h2>8. Changes to Terms</h2>
                <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. Material changes will be posted on this page with an updated effective date.</p>

                <h2>9. Contact</h2>
                <p>If you have questions about these terms, contact us at <a href="mailto:legal@mp3towav.online">legal@mp3towav.online</a>.</p>
            </div>
        </article>
    </main>

    <footer>
        <div class="container">
            <div class="footer-links">
                <a href="/">MP3 to WAV Converter</a>
                <a href="/blog/">Blog</a>
                <a href="/faq/">FAQ</a>
                <a href="/api/">API</a>
                <a href="/privacy/">Privacy</a>
                <a href="/terms/">Terms</a>
            </div>
            <p>&copy; 2026 mp3towav.online — Free, private MP3 to WAV conversion.</p>
        </div>
    </footer>
</body>
</html>
```

**Step 3: Verify the file renders**

Open `terms/index.html` in browser and confirm it matches the site's dark theme.

---

### Task 3: Fix Schema.org — remove fake AggregateRating

**Files:**
- Modify: `index.html:52-58`

**Step 1: Remove the aggregateRating block**

In `index.html`, remove lines 51-58 (the comma before aggregateRating and the entire aggregateRating object). The WebApplication schema at line 37 should end with the `browserRequirements` field closing the object.

Before (lines 50-59):
```
        },
        "browserRequirements": "Requires a modern browser with WebAssembly support",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "2847",
            "bestRating": "5",
            "worstRating": "1"
        }
    }
```

After:
```
        },
        "browserRequirements": "Requires a modern browser with WebAssembly support"
    }
```

**Step 2: Validate the JSON-LD is still valid JSON**

Paste the schema block into a JSON validator or check with Google Rich Results Test.

---

### Task 4: Add Plausible Analytics to all existing pages

**Files:**
- Modify: `index.html` (add script in `<head>`, before `</head>`)
- Modify: `blog/index.html` (add script after `<link rel="stylesheet" href="/content.css">`)
- Modify: `blog/wav-vs-mp3-music-production/index.html` (same pattern)
- Modify: `blog/mp3-to-wav-for-daws/index.html` (same pattern)
- Modify: `blog/privacy-in-audio-conversion/index.html` (same pattern)
- Modify: `blog/audio-formats-for-podcasters/index.html` (same pattern)
- Modify: `blog/why-uncompressed-audio-matters/index.html` (same pattern)
- Modify: `faq/index.html` (add script after stylesheet link)
- Modify: `api/index.html` (add script after stylesheet links)

**The script to add (same on every page):**
```html

    <!-- Plausible Analytics -->
    <script defer data-domain="mp3towav.online" src="https://plausible.io/js/script.js"></script>
```

**Insertion points:**

For `index.html`: Insert after line 34 (`<link rel="stylesheet" href="style.css">`), before the Schema script blocks.

For `blog/index.html`: Insert after line 20 (`<link rel="stylesheet" href="/content.css">`), before the Schema script block on line 22.

For all 5 blog posts: Insert after line 20 (`<link rel="stylesheet" href="/content.css">`), before the Schema script block on line 21.

For `faq/index.html`: Insert after line 21 (`<link rel="stylesheet" href="/content.css">`), before the Schema script block on line 23.

For `api/index.html`: Insert after line 31 (`<link rel="stylesheet" href="/api/api.css">`), before the Schema script block on line 33.

Note: The new privacy/index.html and terms/index.html already have the Plausible script.

**Step 2: Verify script loads**

Visit each page in browser, open DevTools Network tab, confirm `script.js` from plausible.io loads.

---

### Task 5: Update footers on all existing pages

**Files:**
- Modify: `index.html:352-356` — Replace simple footer with footer-links version including Privacy + Terms
- Modify: `blog/index.html:97-107` — Add Privacy + Terms links to footer-links
- Modify: `blog/wav-vs-mp3-music-production/index.html:120-132` — Add Privacy + Terms links
- Modify: `blog/mp3-to-wav-for-daws/index.html` — Same pattern (find footer-links, add 2 links)
- Modify: `blog/privacy-in-audio-conversion/index.html` — Same
- Modify: `blog/audio-formats-for-podcasters/index.html` — Same
- Modify: `blog/why-uncompressed-audio-matters/index.html` — Same
- Modify: `faq/index.html:182-196` — Add Privacy + Terms links to footer-links
- Modify: `api/index.html:312-327` — Add Privacy + Terms links to footer-links

**For index.html** (currently has a simple footer without links), replace:
```html
    <footer>
        <div class="container">
            <p>mp3towav.online — Free MP3 to WAV converter. Your files stay on your device.</p>
        </div>
    </footer>
```

With:
```html
    <footer>
        <div class="container">
            <div class="footer-links">
                <a href="/">MP3 to WAV Converter</a>
                <a href="/blog/">Blog</a>
                <a href="/faq/">FAQ</a>
                <a href="/api/">API</a>
                <a href="/privacy/">Privacy</a>
                <a href="/terms/">Terms</a>
            </div>
            <p>mp3towav.online — Free MP3 to WAV converter. Your files stay on your device.</p>
        </div>
    </footer>
```

**For all other pages** (blog index, 5 blog posts, faq, api), find the `<div class="footer-links">` block and add these two links before the closing `</div>`:
```html
                <a href="/privacy/">Privacy</a>
                <a href="/terms/">Terms</a>
```

---

### Task 6: Update sitemap.xml

**Files:**
- Modify: `sitemap.xml`

**Step 1: Add entries and update dates**

Add two new URL entries before the closing `</urlset>` tag, and update all `lastmod` dates to `2026-03-09`:

New entries to add:
```xml
  <url>
    <loc>https://mp3towav.online/privacy/</loc>
    <lastmod>2026-03-09</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://mp3towav.online/terms/</loc>
    <lastmod>2026-03-09</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
```

Also update all existing `<lastmod>` tags from `2026-03-08` to `2026-03-09`.

**Step 2: Validate sitemap XML**

Ensure the sitemap is well-formed XML by opening it in a browser.

---

### Task 7: Final verification

**Step 1: Verify all pages load correctly**

Open each of these URLs locally or via dev server:
- `/` — converter still works, schema fixed, footer updated, Plausible script present
- `/privacy/` — renders with dark theme, all content visible
- `/terms/` — renders with dark theme, all content visible
- `/blog/` — footer has Privacy + Terms links, Plausible script present
- `/faq/` — footer has Privacy + Terms links, Plausible script present
- `/api/` — footer has Privacy + Terms links, Plausible script present
- One blog post — footer has Privacy + Terms links, Plausible script present

**Step 2: Validate structured data**

Paste index.html WebApplication schema into JSON validator — confirm no `aggregateRating` and valid JSON.

**Step 3: Validate sitemap**

Open sitemap.xml — confirm 11 URLs total (9 original + 2 new), all dates show 2026-03-09.

**Step 4: Commit**

```bash
git add privacy/ terms/ index.html sitemap.xml blog/ faq/ api/
git commit -m "feat: add Privacy Policy, Terms of Service, Plausible analytics, fix Schema.org

- Add /privacy/ page with browser-based processing explanation
- Add /terms/ page with free tool and API terms
- Remove fake AggregateRating from WebApplication schema
- Add Plausible Analytics script to all 10 pages
- Add Privacy + Terms links to all page footers
- Update sitemap.xml with new pages and dates"
```
