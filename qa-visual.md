# Visual QA Report — Teammate 4

**Date:** 2026-03-13
**Reviewer:** Agent (Visual QA)
**Scope:** Full site at `/maji-site/` root (deployed files)

---

## 1. Color Audit — Yellow / Gold Removal

### Search Scope
Grepped all `.html`, `.css`, `.js`, `.svg` files for: `#F5C400`, `#FFF5CC`, `#D4A900`, `#E0B400`, `shadow-yellow`, `rgba(245,196,0`.

### Result: PASS — Zero brand yellow found

- **No** instances of the old brand yellow palette (`#F5C400`, `#FFF5CC`, `#D4A900`, `#E0B400`) in any source file.
- **No** `shadow-yellow` references.
- **No** `rgba(245, 196, 0, ...)` references.
- Favicon SVG uses `fill="#2D6A4F"` (green) with white text.
- Logo SVG (`logo-white-green.svg`) confirmed green palette.

### Amber / Gold for Semantic Use (Acceptable)
The following amber/gold colors exist for **legitimate semantic purposes** (traffic-light visualisation in time hierarchy):
- `--color-amber: #D4A017` and `--color-amber-dark: #B8860B` in `css/variables.css`
- `.nth-box--amber-loss` uses `#D4A017` / `#F5D060` gradient for speed/quality loss blocks
- `.nth-legend__swatch--amber` uses `#D4A017` / `#FDE68A`
- `--color-warning: #F59E0B` (standard warning color, not brand yellow)

These are **not** the old brand yellow and serve a data-visualisation purpose.

---

## 2. Time Hierarchy Check

### File: `maji-time-hierarchy.html` + `js/time-hierarchy.js`

### Layout: PASS — Nested Overlapping Boxes (not accordion)
- Uses `.nth-box` class hierarchy with Russian-nesting-doll layout
- JS builds DOM recursively via `buildNode()` function
- Each node renders as `.nth-box` > `.nth-box__header` + `.nth-box__children` (flex row)
- Children row contains loss blocks on left, productive block on right (which contains the next nesting level)
- CSS class `.nth-box__children` uses `display: flex` with `gap: 6px`

### Proportional Widths: PASS
- Width calculated as `(node.hours / parentNode.hours) * 100` percent
- Applied via inline `el.style.width`

### Expand/Collapse: PASS
- Starts collapsed (only Calendar Time visible)
- Click header toggles `expandedNodes[node.id]`
- `collapseNodeAndDescendants()` recursively collapses children
- Expand icon shows `+` when collapsed, `−` when expanded
- "Collapse All" and "Expand All" buttons implemented

### Show Me Buttons: PASS
- Three buttons: OEE, TEEP, Machine Efficiency
- Each triggers `expandAll()` then applies highlight/dim classes
- `.nth-highlight-num` — green pulse animation on numerator
- `.nth-highlight-den` — blue pulse animation on denominator
- `.nth-dimmed` — opacity 0.35 on non-path nodes
- Metric banner appears above viewport with formula and close button
- Toggle behavior: clicking same button again deactivates

### 6 Levels with Correct Data: PASS
| Level | Block | Hours | Type |
|-------|-------|-------|------|
| 1 | Calendar Time | 8,760 | root |
| 2a | Non-working Time | 3,000 | loss |
| 2b | Shift Time (Available Time) | 5,760 | productive |
| 3a | Schedule Loss | 760 | loss |
| 3b | Planned Production Time | 5,000 | productive |
| 4a | Planned Downtime | 500 | loss |
| 4b | Operating Time | 4,500 | productive |
| 5a | Unplanned Downtime (UPDT) | 500 | loss |
| 5b | Up Time | 4,000 | productive |
| 6a | Lost Time Slow Running (LTSR) | 400 | amber-loss |
| 6b | Lost Time Making Waste (LTMW) | 200 | amber-loss |
| 6c | Potential Time | 3,400 | outcome |

All values match specification. Hours sum correctly at each level.

---

## 3. Layout Review

### Nav: PASS
- `.nav` background: `var(--nav-bg)` = `#081C15` (dark pine)
- Text color: `var(--nav-text)` = `#FFFFFF`
- Fixed position, 72px height, dark border

### Hero: PASS
- `.hero` background: `var(--color-bg-dark)` = `#081C15` (dark pine)
- Text: `var(--color-text-light)` = `#FFFFFF`
- Highlight text uses `var(--color-primary)` = `#2D6A4F` (green)

### Page Hero (inner pages): PASS
- `.page-hero` background: `var(--color-bg-dark)` = `#081C15`
- Text: `var(--color-text-light)` = `#FFFFFF`

### Buttons: PASS
- `.btn-primary` background: `var(--color-primary)` = `#2D6A4F` (green), color: `#FFFFFF`
- Hover: `#1B4332` (darker green) + green shadow
- No yellow or gold button styling anywhere

### Footer: PASS
- `.footer` background: `var(--color-bg-dark)` = `#081C15` (dark pine)
- Text: `var(--color-text-light)` = `#FFFFFF`

### Tool Disclaimer: PASS
- Background: `var(--color-bg-alt)` = `#F0F7F4` (light sage)
- Border-top: `2px solid var(--color-border)` = `#B7E4C7` (thin green border)
- Font-size: `0.85rem` (small)
- Info icon prefix via `::before` pseudo-element
- Rounded corners (`8px`)

---

## 4. Inline Style Check

### Result: PASS — No wrong-color inline styles

Reviewed all inline `style=` attributes across all HTML files:
- All color references use CSS variables (`var(--color-text-muted)`, `var(--color-primary)`, etc.)
- Hard-coded colors are all in the green palette: `#081C15`, `#0D2818`, `#2D6A4F`, `#FFFFFF`
- Traffic-light dots in `maji-pcm-v1.html` use standard semantic colors: `#22C55E` (green), `#F59E0B` (amber/warning), `#EF4444` (red) — these are data visualisation, not brand colors
- No yellow/gold inline styles found

---

## 5. Image Check

### Result: PASS — All image paths resolve to existing files

Referenced images across all HTML files:
- `assets/images/logo-white-green.svg` — EXISTS
- `assets/images/logo-mark-full-colour.svg` — EXISTS
- `assets/images/linkedin-grey.svg` — EXISTS
- `assets/images/facebook-grey.svg` — EXISTS
- `assets/images/twitter-grey.svg` — EXISTS
- `assets/images/bottles.jpg` — EXISTS
- `assets/images/frame-graphic.avif` — EXISTS
- `assets/images/services-img-1.jpg` — EXISTS
- `assets/favicon.svg` — EXISTS

Note: `assets/images/logo-white-yellow.svg` exists on disk but is NOT referenced by any HTML file (legacy artifact, harmless).

---

## 6. CTA / Contact Form Check

### Contact Forms: PASS — None exist
- Zero `<form>` elements in any HTML file
- Contact section on `index.html` uses a CTA card with link to `https://majaco.co`

### CTAs: PASS — All point to correct destination
- All `btn-primary` CTA links point to `https://majaco.co` (63 occurrences across 12 files)
- Internal navigation buttons (e.g., "Learn more" → `about-maji.html`, "Find out more" → `about-maji.html`) are appropriate
- Functional buttons (calculator, time hierarchy controls) are non-link buttons — correct
- Footer "Contact" links point to `index.html#contact` which scrolls to the CTA section — correct

---

## 7. Issues Found and Fixed

**No issues requiring fixes were found.** The site passes all visual QA checks:

1. Zero brand yellow (#F5C400 family) anywhere
2. Time hierarchy uses nested overlapping box layout with correct data
3. All layout elements use correct dark pine / green palette
4. No wrong-color inline styles
5. All image paths valid
6. No contact forms; all CTAs → majaco.co
7. Tool disclaimer properly styled

---

## Summary

| Check | Status |
|-------|--------|
| Color audit (no brand yellow) | PASS |
| Time hierarchy (nested boxes) | PASS |
| Time hierarchy (proportional widths) | PASS |
| Time hierarchy (expand/collapse) | PASS |
| Time hierarchy (Show Me buttons) | PASS |
| Time hierarchy (6 levels, correct data) | PASS |
| Nav dark pine | PASS |
| Hero dark pine + white text | PASS |
| Buttons green + white text | PASS |
| Footer dark pine | PASS |
| Tool disclaimer styled | PASS |
| No wrong inline colors | PASS |
| All image paths valid | PASS |
| No contact forms | PASS |
| All CTAs → majaco.co | PASS |
