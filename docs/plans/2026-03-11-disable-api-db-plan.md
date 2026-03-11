# Disable API/DB & Add AdSense — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Disable all DB/API backend functionality (comment-out approach) and add Google AdSense to all pages, making the site fully ad-revenue dependent.

**Architecture:** Comment out all DB, API route, and middleware code in the Rust backend. Remove API navigation links from all 24 frontend pages. Add AdSense script and redirect rules. No code is deleted — everything is reversible.

**Tech Stack:** Rust/Axum (backend), HTML (frontend), Vercel (hosting/config)

---

### Task 1: Comment out DB module (db.rs)

**Files:**
- Modify: `sonic-converter/src/server/db.rs`

**Step 1: Wrap entire file contents in block comment**

Add `/*` at line 1 and `*/` at the end of the file, with a header comment explaining why:

```rust
// DISABLED: Database functionality disabled — site operates on ad revenue only.
// To re-enable: remove the /* ... */ block comment wrapping this file.
/*
/// Database layer for Sonic Converter API — Turso (libSQL) backed.
... (existing file contents)
*/
```

**Step 2: Commit**

```bash
git add sonic-converter/src/server/db.rs
git commit -m "disable: comment out database module (db.rs)"
```

---

### Task 2: Comment out webhook module (webhook.rs)

**Files:**
- Modify: `sonic-converter/src/server/webhook.rs`

**Step 1: Wrap entire file contents in block comment**

Same approach as db.rs:

```rust
// DISABLED: Webhook functionality disabled — site operates on ad revenue only.
// To re-enable: remove the /* ... */ block comment wrapping this file.
/*
/// Webhook delivery for Sonic Converter API.
... (existing file contents)
*/
```

**Step 2: Commit**

```bash
git add sonic-converter/src/server/webhook.rs
git commit -m "disable: comment out webhook module (webhook.rs)"
```

---

### Task 3: Comment out API routes, DB, and middleware in main.rs

**Files:**
- Modify: `sonic-converter/src/server/main.rs`

**Step 1: Comment out module imports**

Change lines 1-4:
```rust
// DISABLED: DB and webhook modules — site operates on ad revenue only.
// #[cfg(feature = "server")]
// mod db;
// #[cfg(feature = "server")]
// mod webhook;
```

**Step 2: Comment out DB-related code in main()**

In the `main()` function, comment out:
- The entire "Database (optional)" section (lines ~254-299) — replace with:
```rust
    // DISABLED: Database connection
    // let database = match ... { ... };
    let database: Option<()> = None;
```

- Update `AppState` to remove database field, or comment out the struct and simplify:
  - Change `database: Option<db::Database>` to remove it
  - This requires commenting out the `AppState` struct's database field and all references

**Step 3: Comment out protected API routes**

Comment out the protected router block (lines ~308-315):
```rust
    // DISABLED: API routes
    // let protected = Router::new()
    //     .route("/convert", post(convert_handler))
    //     .route("/info", post(info_handler))
    //     .route("/usage", get(usage_handler))
    //     .route_layer(middleware::from_fn_with_state(
    //         state.clone(),
    //         auth_middleware,
    //     ));
```

And update the app router (lines ~317-325) to remove `.nest("/v1", protected)` and `.route("/v1/status", get(status_handler))`:
```rust
    let app = Router::new()
        .route("/", get(health))
        .route("/health", get(health))
        // DISABLED: API endpoints
        // .route("/v1/status", get(status_handler))
        // .nest("/v1", protected)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(cors)
        .with_state(state);
```

Also remove `RequestBodyLimitLayer` (no longer needed without upload endpoints).

**Step 4: Comment out handler functions**

Comment out all handler functions that depend on DB/API:
- `auth_middleware` (lines ~370-489)
- `status_handler` (lines ~505-533)
- `usage_handler` (lines ~537-592)
- `convert_handler` (lines ~597-878)
- `info_handler` (lines ~884-1041)

Keep: `health()` and `security_headers_middleware()`

**Step 5: Comment out unused imports**

Comment out imports no longer needed (Multipart, tempfile, governor, dashmap, etc.). Keep only what `health()` and `security_headers_middleware` need.

**Step 6: Commit**

```bash
git add sonic-converter/src/server/main.rs
git commit -m "disable: comment out API routes, DB connection, and handlers in main.rs"
```

---

### Task 4: Comment out DB-related dependencies in Cargo.toml

**Files:**
- Modify: `sonic-converter/Cargo.toml`

**Step 1: Split the server feature into minimal set**

Change the `server` feature line (line 25) to comment out DB-heavy deps:

```toml
# DISABLED: Full server feature with DB deps. Using minimal server feature instead.
# server = ["dep:axum", "dep:tokio", "dep:tower", "dep:tower-http", "dep:serde", "dep:serde_json", "dep:uuid", "dep:tempfile", "dep:tokio-util", "dep:tracing", "dep:tracing-subscriber", "dep:governor", "dep:dashmap", "dep:libsql", "dep:sha2", "dep:chrono", "dep:hmac", "dep:hex", "dep:reqwest"]
server = ["dep:axum", "dep:tokio", "dep:tower", "dep:tower-http", "dep:serde", "dep:serde_json", "dep:uuid", "dep:tracing", "dep:tracing-subscriber"]
```

This removes: tempfile, tokio-util, governor, dashmap, libsql, sha2, chrono, hmac, hex, reqwest — all DB/API-heavy deps.

**Step 2: Commit**

```bash
git add sonic-converter/Cargo.toml
git commit -m "disable: reduce server feature to minimal deps (no DB/API)"
```

---

### Task 5: Add AdSense script to all HTML pages

**Files (23 non-API pages):**
- `index.html`
- `about/index.html`
- `faq/index.html`
- `privacy/index.html`
- `terms/index.html`
- `blog/index.html`
- `blog/audio-formats-for-game-development/index.html`
- `blog/audio-formats-for-podcasters/index.html`
- `blog/batch-convert-mp3-to-wav/index.html`
- `blog/mp3-to-wav-for-daws/index.html`
- `blog/mp3-to-wav-for-vinyl-cutting/index.html`
- `blog/mp3-vs-flac-vs-wav/index.html`
- `blog/privacy-in-audio-conversion/index.html`
- `blog/wav-vs-mp3-music-production/index.html`
- `blog/webassembly-audio-tools/index.html`
- `blog/why-uncompressed-audio-matters/index.html`
- `alternatives/index.html`
- `alternatives/audacity/index.html`
- `alternatives/cloudconvert/index.html`
- `alternatives/convertio/index.html`
- `alternatives/freeconvert/index.html`
- `alternatives/online-convert/index.html`
- `alternatives/template.html`

**Step 1: Add AdSense script after Vercel analytics line**

In each file, after the Vercel insights script line:
```html
    <script defer src="/_vercel/insights/script.js"></script>
```

Add:
```html
    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6442542494797835"
         crossorigin="anonymous"></script>
```

**Step 2: Commit**

```bash
git add -A *.html **/index.html
git commit -m "feat: add Google AdSense script to all pages"
```

---

### Task 6: Remove API link from header navigation on all pages

**Files:** Same 23 non-API HTML files as Task 5.

**Step 1: Remove API nav link from header**

In each file, remove this line from the `<nav class="site-nav">` `<div class="nav-links">` section:
```html
                <a href="/api/">API</a>
```

Note: On the API pages themselves (`api/index.html`, `api/get-key/index.html`, `api/dashboard/index.html`), the link may have `class="active"`. These pages are being hidden via redirect so we skip them.

**Step 2: Commit**

```bash
git add -A *.html **/index.html
git commit -m "feat: remove API link from header navigation"
```

---

### Task 7: Remove API link from footer navigation on all pages

**Files:** Same 23 non-API HTML files.

**Step 1: Remove API footer link**

In each file's `<div class="footer-links">`, remove:
```html
                <a href="/api/">API</a>
```

**Step 2: Commit**

```bash
git add -A *.html **/index.html
git commit -m "feat: remove API link from footer navigation"
```

---

### Task 8: Add API redirect rules in vercel.json

**Files:**
- Modify: `vercel.json`

**Step 1: Add redirects array**

Add a `"redirects"` key to `vercel.json`:

```json
{
  "cleanUrls": false,
  "redirects": [
    { "source": "/api/:path*", "destination": "/", "permanent": false },
    { "source": "/api", "destination": "/", "permanent": false }
  ],
  "headers": [
    ...existing...
  ]
}
```

Use `permanent: false` (302) so search engines don't cache it permanently — allows easy re-enable later.

**Step 2: Update CSP to allow AdSense**

In the Content-Security-Policy header, add AdSense domains:
- `script-src`: add `https://pagead2.googlesyndication.com https://www.googletagservices.com https://adservice.google.com https://tpc.googlesyndication.com`
- `img-src`: add `https://pagead2.googlesyndication.com`
- `frame-src`: change from `'none'` to `https://googleads.g.doubleclick.net https://tpc.googlesyndication.com`
- `connect-src`: add `https://pagead2.googlesyndication.com`

Remove `https://api.mp3towav.online` from `connect-src` (API is disabled).

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add API redirects and update CSP for AdSense"
```

---

### Task 9: Verify build (optional — if backend is still deployed)

**Step 1: Test that the Rust backend still compiles**

```bash
cd sonic-converter && cargo check --features server
```

Expected: compiles with warnings about unused code (acceptable since code is commented out).

**Step 2: Verify frontend locally**

Open `index.html` in browser and confirm:
- No API link in header nav
- No API link in footer
- AdSense script present in `<head>`
- Converter still works (WASM)

---

## Summary of all commits

1. `disable: comment out database module (db.rs)`
2. `disable: comment out webhook module (webhook.rs)`
3. `disable: comment out API routes, DB connection, and handlers in main.rs`
4. `disable: reduce server feature to minimal deps (no DB/API)`
5. `feat: add Google AdSense script to all pages`
6. `feat: remove API link from header navigation`
7. `feat: remove API link from footer navigation`
8. `feat: add API redirects and update CSP for AdSense`

## Rollback procedure

1. Uncomment db.rs, webhook.rs, main.rs code
2. Restore full `server` feature in Cargo.toml
3. Add API links back to nav/footer
4. Remove redirects from vercel.json
5. Revert CSP changes
