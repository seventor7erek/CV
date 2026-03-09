# Phase 1: Foundation — Design Document

**Date:** 2026-03-09
**Scope:** Privacy Policy, Terms of Service, Schema.org fix, Plausible analytics, sitemap update

## Problem

mp3towav.online lacks legal pages (Privacy Policy, Terms of Service), has misleading Schema.org review markup (fake 4.9/5 rating with 2,847 reviews), has zero analytics visibility, and the sitemap is missing entries. These are foundational issues that hurt trust, SEO, and decision-making.

## Design

### 1. Privacy Policy (`/privacy/index.html`)

- Reuse existing `content.css` styles and page structure from blog posts
- Include same nav/footer as all other pages
- Content sections:
  - Browser-based processing (files never leave device)
  - No file uploads or server-side storage
  - WebAssembly technology explanation
  - API data handling (temp files, immediate deletion)
  - Analytics disclosure (Plausible, no cookies)
  - No tracking cookies
  - Third-party services (Gumroad for payments, Vercel for hosting)
  - Contact information
- Schema.org: WebPage type
- Add to navigation on all pages
- Add to footer on all pages

### 2. Terms of Service (`/terms/index.html`)

- Same styling/structure as Privacy Policy
- Content sections:
  - Service description (free browser-based converter)
  - Acceptable use
  - API terms (tier limits, rate limiting, key management)
  - Intellectual property (users retain rights to their audio)
  - No warranty / limitation of liability
  - Modifications to terms
  - Contact information
- Schema.org: WebPage type
- Add to footer on all pages (not main nav — legal pages typically go in footer only)

### 3. Schema.org Fix (`index.html`)

- Remove the `AggregateRating` object from the WebApplication schema
- Keep: WebApplication, HowTo, FAQPage schemas (all legitimate)
- This prevents potential Google penalty for fabricated reviews

### 4. Plausible Analytics

- Add `<script defer data-domain="mp3towav.online" src="https://plausible.io/js/script.js"></script>` to all pages
- Pages to update: index.html, blog/index.html, 5 blog posts, faq/index.html, api/index.html, privacy/index.html, terms/index.html
- No cookies, GDPR-compliant, ~1KB script
- User needs to sign up at plausible.io separately

### 5. Sitemap Update (`sitemap.xml`)

- Add `/privacy/` (priority 0.5, monthly)
- Add `/terms/` (priority 0.5, monthly)
- Update all `lastmod` dates to 2026-03-09

## Files Modified

| File | Change |
|------|--------|
| `privacy/index.html` | **NEW** — Privacy Policy page |
| `terms/index.html` | **NEW** — Terms of Service page |
| `index.html` | Remove AggregateRating, add Plausible script, add footer links |
| `blog/index.html` | Add Plausible script |
| `blog/*/index.html` (x5) | Add Plausible script |
| `faq/index.html` | Add Plausible script, add footer links |
| `api/index.html` | Add Plausible script, add footer links |
| `sitemap.xml` | Add privacy + terms entries, update dates |

## Risk Assessment

- **Zero risk** to converter functionality — no changes to `app.js`, `style.css`, or WASM
- All changes are additive (new pages) or minimal edits (script tags, footer links, schema removal)
- Easily reversible via git

## Verification

- Visit all new and modified pages in browser
- Validate structured data with Google Rich Results Test
- Confirm Plausible script loads (check network tab)
- Verify sitemap is valid XML
- Check all nav/footer links work
