# Migration Complete

## Pages Built

| Page | File | Source URL |
|------|------|------------|
| Home | index.html | https://majiai.co |
| About maji | about-maji.html | https://majiai.co/about-maji |
| Speed-Downtime Calculator | maji-speed-downtime.html | https://majiai.co/maji-speed-downtime |
| Split Solve | maji-splitsolver.html | https://majiai.co/maji-splitsolver |
| Manufacturing Psychology Pitfalls | maji-psychology-v1.html | https://majiai.co/maji-psychology-v1 |
| Process Control Methodology | maji-pcm-v1.html | https://majiai.co/maji-pcm-v1 |
| Raw Material Stock Calculator | maji-stock-calculator-v1.html | https://majiai.co/maji-stock-calculator-v1 |
| Time Hierarchy Framework | maji-time-hierarchy.html | https://majiai.co/maji-time-hierarchy |
| Efficiency Formulas Quick Reference | maji-efficiency-formulas.html | https://majiai.co/maji-efficiency-formulas |
| TOC Subordination | maji-toc-subordination.html | https://majiai.co/maji-toc-subordination |
| Privacy Policy | privacy-policy.html | https://majiai.co/privacy-policy |
| Site Map | maji-sitemap.html | https://majiai.co/maji-sitemap |

**Total: 12 pages**

## QA Findings

All issues were resolved before commit:

1. **CTA links** — Verified: all 37 CTA/button links across all pages point to https://majaco.co. Zero links to majaihub.com.
2. **Meta tags** — All 12 pages have `<title>` and `<meta name="description">` tags.
3. **OG tags** — All 12 pages have OpenGraph meta tags (og:title, og:description, og:type, og:url, og:image).
4. **CSS includes** — All 12 pages include both css/variables.css and css/style.css.
5. **Image alt text** — All images (including logo marks and social icons) have descriptive aria-label or alt text.
6. **Nav links** — Consistent navigation on all pages. All internal links use .html extensions for GitHub Pages compatibility.
7. **Breadcrumbs** — All inner pages have breadcrumb navigation.
8. **Canonical URLs** — All pages have canonical link tags pointing to majiai.co.
9. **No broken internal links** — All href values verified to match actual file names in root.
10. **Favicon** — SVG favicon created and referenced on all pages.

## Remaining Manual Steps

1. **GitHub Pages configuration**: Go to https://github.com/Jamie-Diamond/maji-site → Settings → Pages → set Source to "Deploy from branch: main / (root)" and set Custom domain to `majiai.co`.

2. **Verify CNAME**: Confirm the CNAME file at repo root contains exactly `majiai.co` (no www prefix).

3. **HTTPS enforcement**: Once DNS propagates, return to Settings → Pages and tick "Enforce HTTPS".

4. **Contact form**: The current contact form redirects to https://majaco.co on submit (static site limitation). If a working form is needed, integrate a service such as Formspree, Netlify Forms, or EmailJS.

5. **Google Analytics / tracking**: Add analytics script to each page if required.

6. **Assets/images**: No binary image assets were available via WebFetch. The design uses CSS/SVG elements throughout. If brand image files (logo PNG/SVG, hero images) become available, add them to /assets/ and update the HTML references.

7. **Modern Slavery Statement**: The original site had this linked but no dedicated page was found. A page will need to be created.

## DNS Configuration (GoDaddy)

Add these DNS records in GoDaddy for majiai.co:

| Type  | Name | Value                          |
|-------|------|--------------------------------|
| A     | @    | 185.199.108.153                |
| A     | @    | 185.199.109.153                |
| A     | @    | 185.199.110.153                |
| A     | @    | 185.199.111.153                |
| CNAME | www  | Jamie-Diamond.github.io        |

After adding DNS records, go to the GitHub repo Settings → Pages and verify the custom domain is set to majiai.co with HTTPS enforced.

DNS propagation typically takes 10–60 minutes; in some cases up to 48 hours.
