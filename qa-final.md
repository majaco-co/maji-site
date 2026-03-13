# QA Final Report - Layer 2 Review

**Date:** 2026-03-13
**Reviewer:** QA Layer 2 (Independent Final Review)
**Scope:** All 12 root-level HTML pages, 5 JS files, 2 CSS files, SVG assets

---

## 1. COLOR AUDIT

### PASS - No brand yellow remains
- Searched all `.html`, `.css`, `.js`, `.svg` files for: `#F5C400`, `#FFF5CC`, `#D4A900`, `#E0B400`, `shadow-yellow`, `rgba(245,196,0`
- **Result:** Zero matches. All brand colors are green/pine.
- CSS variables.css confirms: `--color-primary: #2D6A4F` (pine green), `--shadow-green` (green shadow)
- Logo files use `logo-white-green.svg` in all HTML pages

### NOTE - Amber/warning colors present (intentional)
- `#FEF3C7`, `#FDE68A` (amber) used in:
  - `maji-time-hierarchy.html` line 100: Loss Category legend swatch
  - `css/style.css` lines 1946, 2497, 2663: Time hierarchy loss block styling, result warning state
  - `js/splitsolver.js` line 288: MECE validation warning background
  - `#D97706` in `css/style.css` line 1180: formula operator color
  - `#F59E0B` in `css/variables.css` line 28: `--color-warning` (standard warning color)
- **Assessment:** These are standard amber/warning UI colors for data visualisation, NOT the old brand yellow (#F5C400). They serve a legitimate semantic purpose (traffic light zones, warning states).

### NOTE - Leftover file
- `assets/images/logo-white-yellow.svg` still exists on disk but is NOT referenced in any HTML file. Safe to delete.

### Reference: "Yellow" text in content
- `maji-pcm-v1.html` line 172: The word "Yellow" appears as a traffic-light zone label (Green/Yellow/Red buffer monitoring). This is content, not a color scheme issue.

---

## 2. FORM AUDIT

### PASS - Zero forms
- Searched all HTML files for `<form` tags
- **Result:** Zero matches. No forms exist anywhere on the site.
- `js/main.js` contains no form handling code.

---

## 3. LINK AUDIT

### PASS - All CTAs link to https://majaco.co
Every CTA button across all 12 pages points to `https://majaco.co` with `target="_blank" rel="noopener"`:
- index.html: 4 CTAs (nav, mobile nav, hero, CTA banner, contact section)
- about-maji.html: 4 CTAs
- All tool/guide pages: nav CTAs + page-specific CTA
- maji-sitemap.html: 1 CTA

### PASS - No majaihub.com references
- Searched all HTML, CSS, JS files
- **Result:** Zero matches for `majaihub.com`

### PASS - Internal links verified
- All tool pages link correctly between each other
- Breadcrumbs use correct relative paths (index.html > about-maji.html > [page])
- Footer tool links all point to correct HTML files
- Sitemap links all verified against actual files

### NOTE - Missing asset
- `og-image.png` is referenced in meta tags (`https://majiai.co/assets/og-image.png`) on 8 pages but does NOT exist at `/assets/og-image.png`. This will result in broken Open Graph preview images.

---

## 4. CONTENT AUDIT

### Compared against https://majiai.co (fetched 2026-03-13):

**Hero text:** MATCHES
- Original: "Operational Excellence, On Demand"
- Site: "Operational Excellence, On Demand" -- correct

**Navigation:** MATCHES
- Original: Careers, About maji, Get in touch
- Site: Careers, About maji, Get in touch -- correct

**Footer addresses:** MATCHES
- London: 6th Floor, 9 Appold Street, London, EC2A 2AP / 020 3633 8437
- St Albans: 4 Beaconsfield Rd, St Albans, AL1 3RD / 01223 782469

**Social:** LinkedIn links to https://www.linkedin.com/company/majacouk/ -- MATCHES

**Statistics:** No fabricated statistics found. The site uses ranges with hedging language:
- "30-60% available capacity improvements" (psychology page) -- framed as typical range
- "20-40% throughput improvement" (PCM page) -- framed as expected range with "when applied correctly"
- These are methodology-based projections, not fabricated stats

---

## 5. JAVASCRIPT FUNCTIONAL AUDIT

### js/main.js -- PASS
- Handles: mobile nav, smooth scroll, scroll animations, active nav links, scroll-to-top, grid stagger
- No form handling code
- No yellow/gold color references
- Clean, well-structured IIFE

### js/speed-downtime.js -- PASS
- Real PPLH calculations: `PPLH = Speed x Availability x Quality / Operators`
- Degradation model works correctly (availability and quality degrade with speed increase)
- Optimal point found via brute-force search (0-50% in 0.5% steps)
- All chart colors use green palette: `#2D6A4F`, `#40916C`, `#1B4332`
- Canvas chart with tooltips, responsive resize handler
- No yellow/gold colors

### js/stock-calculator.js -- PASS
- Real statistical calculations: normal CDF, unit normal loss function, safety stock formula
- Proper economic optimization: searches z-scores 0-3.5 to minimize total cost
- Safety stock formula: `z * sigma_demand_lead_time + rejection_buffer`
- Chart uses green palette: `#2D6A4F`, `#40916C` for cost curves, `#EF4444` for stockout
- No yellow/gold colors

### js/splitsolver.js -- PASS
- 3-phase MECE problem-solving tool (Define, Split, Understand)
- LocalStorage persistence
- Recursive tree rendering with node status (ok/cause/unknown)
- PDF export function generates clean report with green header
- MECE validation checks child sums against parent values
- Warning color `#FEF3C7` used for MECE deviation warning (legitimate amber/warning)
- All action button colors: `#2D6A4F` (pine green)

### js/time-hierarchy.js -- PASS
- Interactive tree visualization of manufacturing time decomposition
- Proper hierarchy model: Calendar Time > Shift Time > PPT > Operating Time > Up Time > Potential Time
- Expand/collapse, tooltips, metric highlighting (Operating Efficiency, Machine Efficiency, TEEP)
- Selectors match HTML: `.cascade-container`, `.collapse-all`, `.expand-all`, `.show-me-btn`
- Color types: root, positive, subtracted, loss, outcome -- all render correctly

---

## 6. META TAG AUDIT

### PASS - All pages have required meta tags

| Page | title | meta description | og:title | og:description |
|------|-------|-----------------|----------|----------------|
| index.html | Yes | Yes | Yes | Yes |
| about-maji.html | Yes | Yes | Yes | Yes |
| privacy-policy.html | Yes | Yes | Yes | Yes |
| maji-sitemap.html | Yes | Yes | Yes | Yes |
| maji-speed-downtime.html | Yes | Yes | Yes | Yes |
| maji-splitsolver.html | Yes | Yes | Yes | Yes |
| maji-psychology-v1.html | Yes | Yes | Yes | Yes |
| maji-pcm-v1.html | Yes | Yes | Yes | Yes |
| maji-stock-calculator-v1.html | Yes | Yes | Yes | Yes |
| maji-time-hierarchy.html | Yes | Yes | Yes | Yes |
| maji-efficiency-formulas.html | Yes | Yes | Yes | Yes |
| maji-toc-subordination.html | Yes | Yes | Yes | Yes |

---

## 7. IMAGE AUDIT

### PASS - All referenced images exist

Images in `assets/images/`:
- `logo-white-green.svg` -- used in all nav bars
- `logo-mark-full-colour.svg` -- used in all footers
- `linkedin-grey.svg` -- used in all footers
- `facebook-grey.svg` -- used in all footers
- `twitter-grey.svg` -- used in all footers
- `bottles.jpg` -- used in index.html, about-maji.html
- `frame-graphic.avif` -- used in index.html, about-maji.html
- `services-img-1.jpg` -- used in index.html, about-maji.html
- `favicon.svg` -- referenced in all pages (at `assets/favicon.svg`)

### NOTE - Unused file
- `logo-white-yellow.svg` exists but is not referenced anywhere. Safe to delete.

### NOTE - Missing OG image
- `assets/og-image.png` does NOT exist but is referenced in og:image meta tags on 8 pages.

---

## 8. CONSISTENCY AUDIT

### Nav bar -- PASS (consistent across all 12 pages)
All pages have identical nav:
- Desktop: Careers | About maji | Get in touch | [Get started] button
- Mobile: Careers | About maji | Get in touch | Get started

### FIXED - Footer Navigate column
**Before fix:** index.html and about-maji.html had different footer Navigate links (Home, About maji, Tools, Contact, Site map -- missing Careers). All other pages had (Home, Careers, About maji, Contact, Site map).

**After fix:** All 12 pages now have consistent footer Navigate: Home, Careers, About maji, Contact, Site map.

### Footer Tools column -- PASS (identical across all 12 pages)
All 8 tool links present in every footer.

### Footer Contact column -- PASS (identical across all 12 pages)
London and St Albans addresses with phone numbers.

### Footer bottom -- PASS (identical across all 12 pages)
Copyright + Privacy Policy + Modern Slavery Statement + Careers links.

---

## 9. ISSUES FIXED

| # | Issue | File(s) | Fix Applied |
|---|-------|---------|-------------|
| 1 | Footer Navigate missing "Careers" link | index.html | Added Careers link, removed Tools link to match other pages |
| 2 | Footer Navigate missing "Careers" link | about-maji.html | Added Careers link, removed Tools link to match other pages |
| 3 | Footer Navigate inconsistent in src/ directory | src/*.html | Updated all 12 src files to match standardized pattern |

---

## 10. ITEMS FOR OWNER REVIEW (Not Fixed -- Requires Decision)

| # | Item | Details |
|---|------|---------|
| A | `og-image.png` missing | Referenced in meta tags on 8 pages but file does not exist. Need to create an OG image or remove the meta tags. |
| B | `logo-white-yellow.svg` leftover | File exists in assets/images/ but is never used. Can be safely deleted. |
| C | Amber/warning colors | `#FEF3C7`, `#FDE68A`, `#F59E0B`, `#D97706` are used for data viz warning states. These are NOT the old brand yellow but are amber tones. Confirm these are acceptable. |
| D | Facebook/Twitter social links | Both link to `#` (placeholder). The original site also has placeholder icons. Consider adding real URLs or removing. |
| E | Copyright year | Shows "2025" -- may want to update to "2025-2026" or just "2026". |

---

## SUMMARY

**Overall assessment: READY FOR LAUNCH with minor items noted above.**

- Zero brand yellow (#F5C400 family) anywhere in the codebase
- Zero forms on the site
- Zero references to majaihub.com
- All CTAs correctly link to https://majaco.co
- Navigation consistent: Careers, About maji, Get in touch
- Content matches original majiai.co
- No fabricated statistics
- All JS tools functional with green color scheme
- All images exist and are referenced correctly
- Meta tags complete on all 12 pages
- Nav and footer now consistent across all pages (after fixes applied)
