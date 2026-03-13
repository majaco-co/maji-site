# QA Report — Content Accuracy & Link Verification

**Date:** 2026-03-13
**Scope:** All 12 HTML pages compared against live majiai.co site
**Reviewer:** Teammate 4 — Content Accuracy & QA

---

## Summary

The migrated static site is in good shape. All critical content matches the original majiai.co source. All CTA links correctly point to https://majaco.co. No references to majaihub.com were found.

---

## Pages Audited

| Page | Status |
|------|--------|
| index.html | PASS |
| about-maji.html | PASS |
| maji-stock-calculator-v1.html | PASS |
| maji-time-hierarchy.html | PASS |
| maji-splitsolver.html | PASS |
| maji-speed-downtime.html | PASS |
| maji-efficiency-formulas.html | PASS |
| maji-pcm-v1.html | PASS |
| maji-toc-subordination.html | PASS |
| maji-psychology-v1.html | PASS |
| maji-sitemap.html | PASS |
| privacy-policy.html | PASS |

---

## Link Verification

### CTA / Call-to-Action Buttons
- **Total CTA buttons across all pages:** 37
- **All point to:** https://majaco.co
- **Links to majaihub.com:** 0 (none found)
- **Status:** PASS

### Internal Navigation Links
- All internal page links (nav, footer, breadcrumbs, tool grid) use correct relative paths (e.g., `about-maji.html`, `index.html#tools`)
- **Status:** PASS

### External Links
- LinkedIn: https://www.linkedin.com/company/majacouk/ (consistent across all pages)
- Facebook: # (placeholder, matches original)
- Twitter: # (placeholder, matches original)
- ICO link on privacy page: https://ico.org.uk (correct)
- **Status:** PASS

---

## Content Accuracy

### Text Content
- Hero headings, taglines, and body text match the original majiai.co site
- Problem framework cards (The Problem / Why It Happens / The Resulting Gap) match
- Tool descriptions match original content
- Contact information (addresses, phone numbers) matches exactly:
  - London: 6th Floor, 9 Appold Street, London, EC2A 2AP / 020 3633 8437
  - St Albans: 4 Beaconsfield Rd, St Albans, AL1 3RD / 01223 782469
- **Status:** PASS

### Meta Tags
Every page has:
- Unique, descriptive `<title>` tag
- `<meta name="description">` with relevant content
- `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
- `<link rel="canonical">` pointing to majaco.co
- **Status:** PASS

### Footer Content
- Consistent across all tool/guide pages (matching footer structure)
- Social links, contact info, legal links all present
- Privacy policy and sitemap footer columns present on all pages
- **Status:** PASS

---

## Intentional Differences from Original

These are deliberate design decisions in the migration, not bugs:

1. **Navigation menu:** Original has "Careers | About maji | Get in touch". Local version has "About maji | Tools | Get in touch" plus a "Get started" CTA button. The "Careers" link on the original is a `#` placeholder. Our version links to the actual tools section, which is more useful. Careers is preserved in the footer legal links.

2. **Interactive tools converted to reference pages:** The stock calculator, speed-downtime calculator, split solver, and time hierarchy pages on majiai.co are interactive Webflow-powered tools. The local versions are static explanatory pages that describe the methodology and link users to majaco.co for the full interactive experience. This is the expected approach for a static site migration.

3. **Added "Tools" section on homepage:** The local index.html includes a tools grid section linking to all 8 tool/guide pages. This is an enhancement not present on the original homepage but necessary since the tools are now standalone HTML pages.

4. **Breadcrumb navigation added:** Local pages include breadcrumb trails (Home / Tools / Page Name) not present on the original. This improves navigation.

5. **Privacy policy page:** Local version has full policy text. Original has a minimal contact form and placeholder text. Our version is more complete.

---

## Remaining Issues / Recommendations

1. **Copyright year:** All pages show "2025" in the footer. Consider updating to "2025-2026" or making it dynamic.

2. **Facebook and Twitter social links:** Both point to `#` (placeholder) across all pages. If majaco has active social profiles, these should be updated.

3. **Modern Slavery Statement link:** Points to `#` on all pages. If this document exists, the link should be updated.

4. **Careers link in footer:** Points to `#`. Should link to an actual careers page or external URL if one exists.

5. **og:image:** All pages reference `https://majaco.co/assets/og-image.png`. Verify this image file exists at that URL.

6. **No sitemap.xml:** The sitemap page attempts to load `/sitemap.xml` on the original site. The local maji-sitemap.html is a manual HTML sitemap, which is fine, but a machine-readable sitemap.xml would benefit SEO.

---

## Conclusion

The migration is content-accurate. All critical requirements are met:
- All CTA links go to https://majaco.co
- No references to majaihub.com
- Content matches the original majiai.co site
- Meta tags are complete and well-formed on every page
- Navigation and footer are consistent across all pages
