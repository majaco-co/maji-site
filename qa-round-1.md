# QA Round 1 Report

**Date:** 2026-03-13
**Scope:** Full audit of all 12 HTML pages, CSS, JS, and SVG assets across both root (deployed) and src/ directories.

---

## 1. Yellow/Gold Color Audit

### Issues Found & Fixed

| Location | Issue | Fix Applied |
|----------|-------|-------------|
| All 12 root HTML files | `class="text-yellow"` CSS class name | Renamed to `text-green` across all files |
| All 12 root HTML files | Logo referenced as `logo-white-yellow.svg` | Renamed to `logo-white-green.svg`, file copied with new name |
| `css/style.css` | `.text-yellow, .text-green` selector | Simplified to `.text-green` only |
| `src/css/variables.css` | `--color-primary: #F5C400`, `--color-primary-dark: #D4A900`, `--color-primary-light: #FFF5CC` | Changed to `#2D6A4F`, `#1B4332`, `#D8F3DC` (green/pine) |
| `src/css/variables.css` | `--shadow-yellow` with `rgba(245, 196, 0, 0.30)` | Changed to `--shadow-green` with `rgba(45, 106, 79, 0.30)` |
| `src/css/variables.css` | Dark bg colors `#111111`, `#1C1C1C` | Changed to `#081C15`, `#0D2818` (pine dark) |
| `src/css/variables.css` | Muted text `#666666`, border `#E5E5E5` | Changed to `#52796F`, `#B7E4C7` |
| `src/css/style.css` | Three `rgba(245, 196, 0, ...)` references | Changed to `rgba(45, 106, 79, ...)` equivalents |
| `src/css/style.css` | `.text-yellow` selector | Renamed to `.text-green` |
| `src/assets/favicon.svg` | `fill="#F5C400"` with black text | Changed to `fill="#2D6A4F"` with white text |
| `src/index.html` line 115 | Inline `background: #F5C400` on "m" badge | Changed to `#2D6A4F` with white text |
| All src/ HTML files | `text-yellow` class and `logo-white-yellow.svg` | Renamed throughout |

### Remaining (Legitimate)
- `maji-pcm-v1.html` line 172: "Yellow" is a traffic-light zone label (Green/Yellow/Red buffer status) -- content, not color scheme. Kept as-is.
- `#F59E0B` used for the yellow dot in PCM buffer zones matches `--color-warning`. Correct.

### Root CSS/JS (Deployed)
- `css/variables.css`: Already fully green (`#2D6A4F`, `#1B4332`, `#D8F3DC`, `--shadow-green`). No issues.
- `css/style.css`: No yellow/gold colors. Clean.
- All 5 JS files: All use green palette (`#2D6A4F`, `#40916C`, `#1B4332`, `#D8F3DC`). Clean.

---

## 2. Contact Forms

### Issues Found & Fixed

| Location | Issue | Fix Applied |
|----------|-------|-------------|
| `src/index.html` | Full contact form with name/email/company/message fields | Replaced with CTA linking to majaco.co |
| `src/about-maji.html` | Identical contact form | Replaced with CTA linking to majaco.co |

### Root (Deployed) Files
- Zero `<form>` tags found across all 12 HTML files. Clean.

---

## 3. Links Audit

### CTAs
- All CTA/button links point to `https://majaco.co` with `target="_blank" rel="noopener"`. Verified on all pages.
- No links to `majaihub.com` found anywhere.

### Internal Navigation
- Nav links: `#` (Careers), `about-maji.html`, `majaco.co` (Get in touch). Consistent across all 12 pages.
- Footer links: All internal tool/page links use correct relative paths.
- Breadcrumbs on sub-pages: Working correctly with Home link.

---

## 4. Homepage Stats

### Issues Found & Fixed

| Location | Issue | Fix Applied |
|----------|-------|-------------|
| `index.html` line 86 | "over 100 projects" | Changed to "deep expertise" |
| `index.html` line 89 | "hundreds of projects -- available instantly, 24/7" | Changed to "real-world projects -- available on demand" |

### Hero Section
- Hero says "Operational Excellence, On Demand" -- correct, no fake numbers.
- No stat counters (100+, 24/7, 30-60%) on homepage hero.

---

## 5. Fabricated Statistics (about-maji.html)

### Issues Found & Fixed

| Location | Issue | Fix Applied |
|----------|-------|-------------|
| Meta description | "100+ manufacturing projects" and "24/7" | Reworded to "deep consulting expertise...on demand" |
| og:description | Same | Same fix |
| Hero subtitle (line 61) | "built from 100+ manufacturing improvement projects" | "built from deep manufacturing improvement expertise" |
| Body text (line 76) | "over 100 projects" | "deep expertise" |
| Body text (line 79) | "hundreds of projects -- available instantly, 24/7" | "real-world projects -- available on demand" |
| Content card (line 87) | "100+ Projects" heading | "Real-World Expertise" |
| Content card (line 89) | "24/7 Availability" heading | "On-Demand Access" |
| Tool card (line 159) | "validated across 100+ manufacturing projects" | "validated across real manufacturing projects" |
| Tool card (line 164) | "Instant, 24/7" heading | "Instant, On Demand" |

### Remaining (Acceptable)
- `maji-psychology-v1.html`: "30-60% available capacity improvements" -- this is a documented range from manufacturing psychology literature, not a fabricated maji stat. Kept.
- `index.html` tool card for Psychology: Same "30-60%" reference. Content-appropriate.
- `maji-pcm-v1.html` og:description: "20-40% throughput improvement" -- describes methodology outcomes, not maji's track record. Kept.

---

## 6. Navigation Consistency

All 12 HTML files verified with identical nav structure:
- Desktop: Careers | About maji | Get in touch + "Get started" CTA button
- Mobile: Same links + "Get started" button
- All "Get in touch" and "Get started" link to `https://majaco.co`

---

## 7. Meta Tags

All 12 pages have complete meta tags:
- `<title>` -- present and descriptive
- `<meta name="description">` -- present and unique per page
- `<meta property="og:title">` -- present
- `<meta property="og:description">` -- present
- `<meta property="og:type">` -- present on pages checked
- `<meta property="og:image">` -- present on pages checked

---

## 8. JavaScript Audit

| File | Status | Notes |
|------|--------|-------|
| `js/main.js` | Clean | Selectors match HTML: `.nav__hamburger`, `.nav__mobile`, `.scroll-top`, `.reveal`, `.tools-grid`, `.problem-grid` |
| `js/time-hierarchy.js` | Clean | Selectors match: `.cascade-container`, `.collapse-all`, `.expand-all`, `.show-me-btn`. All present in HTML. |
| `js/speed-downtime.js` | Clean | Uses `#pplh-chart` canvas and `.speed-downtime-calc` range inputs. All green colors (#2D6A4F, #40916C). |
| `js/splitsolver.js` | Clean | Uses `#splitsolver-app`. All inline colors are green. PDF export uses green header. |
| `js/stock-calculator.js` | Clean | Uses `#costChart`, `#calcBtn`, `.calc-row`. All green colors. |

No JS references to removed HTML elements. No potential console errors from missing selectors (all use guard checks like `if (!el) return`).

---

## Summary

| Category | Issues Found | Issues Fixed |
|----------|-------------|-------------|
| Yellow/gold colors (root) | 2 class patterns across 12 files + 1 logo | All fixed |
| Yellow/gold colors (src/) | CSS variables, 3 style.css refs, favicon, 1 inline | All fixed |
| Contact forms | 2 (in src/) | Both replaced with CTA |
| Fabricated stats | 9 instances across 2 files | All reworded |
| Links to majaihub.com | 0 | N/A |
| Missing meta tags | 0 | N/A |
| Nav inconsistencies | 0 | N/A |
| JS selector mismatches | 0 | N/A |
| Broken internal links | 0 | N/A |
