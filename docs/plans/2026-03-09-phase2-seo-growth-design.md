# Phase 2: SEO Growth — Design Document

**Date:** 2026-03-09
**Scope:** 5 competitor alternative pages, 5 blog posts, 1 About page, sitemap/nav updates

## Problem

mp3towav.online has strong technical differentiation (Rust/WASM, privacy-first) but low search visibility. No competitor comparison pages exist despite having a detailed template. Only 5 blog posts limit topical authority. No About page hurts trust signals.

## Design

### 1. Alternative Pages (6 files)

Use existing `alternatives/template.html` to create 5 competitor comparison pages plus a hub page.

| Page | Path | Target Keyword |
|------|------|---------------|
| Hub | `/alternatives/index.html` | mp3 to wav converter alternatives |
| FreeConvert | `/alternatives/freeconvert/index.html` | freeconvert alternative |
| CloudConvert | `/alternatives/cloudconvert/index.html` | cloudconvert alternative |
| Convertio | `/alternatives/convertio/index.html` | convertio alternative |
| Online-Convert | `/alternatives/online-convert/index.html` | online-convert alternative |
| Audacity | `/alternatives/audacity/index.html` | audacity alternative mp3 to wav |

Per page:
- Fill template placeholders with competitor-specific data (features, pricing, file limits, privacy model, ads)
- Unique meta title/description and OG tags
- Plausible analytics script
- Standard nav (with About link) + standard footer
- Canonical URL

Hub page (`/alternatives/index.html`):
- Lists all 5 competitor comparisons with brief descriptions
- Uses `content.css` layout
- Internal links to each comparison page

### 2. Blog Posts (5 files)

Each post at `/blog/[slug]/index.html`, reusing existing blog structure and `content.css`.

| # | Slug | Title | Target Audience |
|---|------|-------|-----------------|
| 1 | `mp3-to-wav-for-vinyl-cutting` | MP3 to WAV for Vinyl Cutting & Lathe | Vinyl enthusiasts, small pressing plants |
| 2 | `audio-formats-for-game-development` | Best Audio Formats for Game Development | Game devs (Unity, Unreal, Godot) |
| 3 | `batch-convert-mp3-to-wav` | How to Batch Convert MP3 Files to WAV | Power users, producers with large libraries |
| 4 | `mp3-vs-flac-vs-wav` | MP3 vs FLAC vs WAV: Which Should You Choose? | General audience comparing formats |
| 5 | `webassembly-audio-tools` | Browser-Based Audio Tools: The WebAssembly Revolution | Developers, tech-curious users |

Per post:
- Schema.org Article + BreadcrumbList markup
- Unique meta/OG tags
- Plausible analytics
- Internal links to 2-3 related posts and the converter
- Standard nav (with About link) + standard footer

### 3. About Page (1 file)

Path: `/about/index.html`
Layout: `content.css` (same as Privacy/Terms)

Content sections:
- Hero: "Built by a developer who was tired of ad-heavy, privacy-invasive converters"
- The Problem: Every online converter uploads files, shows ads, requires signups
- The Solution: Custom Rust/WebAssembly audio engine (Sonic Converter) runs in-browser
- Why Privacy Matters: Files never leave device — technical guarantee, not marketing
- Open Technology: Powered by Symphonia (Rust audio decoder) compiled to WASM
- Contact: Email link

### 4. Cross-cutting Changes

- **Nav bar:** Add "About" link (between FAQ and API) on ALL pages (13 existing + 12 new = 25 total)
- **Sitemap:** Add 12 new URLs (6 alternatives + 5 blog posts + 1 about)
- **Blog index:** Add 5 new blog post cards to `/blog/index.html`
- **Internal linking:** Blog posts link to related posts + converter. Alternative pages link to relevant blog posts.
- **Footer:** No changes needed (standard 6-link footer from Phase 1)

## Files

| File | Change |
|------|--------|
| `alternatives/index.html` | **NEW** — Hub page listing all comparisons |
| `alternatives/freeconvert/index.html` | **NEW** — FreeConvert comparison |
| `alternatives/cloudconvert/index.html` | **NEW** — CloudConvert comparison |
| `alternatives/convertio/index.html` | **NEW** — Convertio comparison |
| `alternatives/online-convert/index.html` | **NEW** — Online-Convert comparison |
| `alternatives/audacity/index.html` | **NEW** — Audacity comparison |
| `blog/mp3-to-wav-for-vinyl-cutting/index.html` | **NEW** — Vinyl cutting blog post |
| `blog/audio-formats-for-game-development/index.html` | **NEW** — Game dev audio post |
| `blog/batch-convert-mp3-to-wav/index.html` | **NEW** — Batch conversion post |
| `blog/mp3-vs-flac-vs-wav/index.html` | **NEW** — Format comparison post |
| `blog/webassembly-audio-tools/index.html` | **NEW** — WebAssembly audio post |
| `about/index.html` | **NEW** — About page |
| `blog/index.html` | Add 5 new blog post cards |
| All 25 HTML files | Add "About" nav link |
| `sitemap.xml` | Add 12 new URLs |

## Risk Assessment

- Zero risk to converter functionality — no changes to `app.js`, `style.css`, or WASM
- All changes are additive (new pages) or minimal edits (nav links, sitemap)
- Alternative pages use a proven template
- Easily reversible via git

## Verification

- Visit all new pages in browser
- Validate structured data with Google Rich Results Test
- Confirm Plausible script loads on all new pages
- Verify sitemap is valid XML with all 23 URLs
- Check all nav/footer links work
- Verify internal links between posts resolve correctly
