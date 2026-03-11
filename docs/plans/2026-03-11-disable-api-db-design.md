# Design: Disable API/DB & Add AdSense

**Date**: 2026-03-11
**Approach**: Comment-Out + Feature Flag (Approach 1)

## Goal

Make the site fully dependent on visits and ad views by disabling all DB/API functionality without deleting code. Everything should be reversible.

## Changes

### 1. Backend (Rust) - Comment out DB & API

- **main.rs**: Comment out DB connection, API routes (`/v1/convert`, `/v1/info`, `/v1/usage`, `/v1/status`), auth middleware, security headers middleware. Keep only basic health check.
- **db.rs**: Comment out entire file contents.
- **webhook.rs**: Comment out entire file contents.
- **Cargo.toml**: Comment out DB-related dependencies (libsql, etc.) to reduce build size.

### 2. Frontend - Remove API references

- Remove "API" link from header navigation across all 24 pages.
- Remove "API" link from footer navigation across all 24 pages.
- Remove any API CTAs or references in page content.

### 3. Vercel Redirects

- Add redirect rule in `vercel.json`: `/api/*` -> `/` (301).
- Covers anyone with bookmarks to API pages.

### 4. Google AdSense

- Add AdSense script to `<head>` of all 24 pages:
  ```html
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6442542494797835"
       crossorigin="anonymous"></script>
  ```

### 5. What stays unchanged

- WASM conversion (client-side)
- Plausible + Vercel Analytics
- Blog, FAQ, About, Privacy, Terms content
- Service Worker
- app.js client-side tracking (localStorage)
- All API page files remain in repo (just not accessible via redirect)

## Rollback

To re-enable: uncomment backend code, uncomment Cargo dependencies, add API links back to navigation, remove `/api/*` redirect.
