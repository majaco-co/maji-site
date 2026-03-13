# Image Assets QA Report

## Downloaded Assets (saved to ./assets/images/)

| File | Source | Status |
|------|--------|--------|
| logo-white-yellow.svg | Webflow CDN (header logo) | OK |
| logo-mark-full-colour.svg | Webflow CDN (footer logo mark) | OK |
| facebook-grey.svg | Webflow CDN (social icon) | OK |
| linkedin-grey.svg | Webflow CDN (social icon) | OK |
| twitter-grey.svg | Webflow CDN (social icon) | OK |
| bottles.jpg | Webflow CDN (about page) | OK |
| frame-graphic.avif | Webflow CDN (about page) | OK |
| services-img-1.jpg | Webflow CDN (about page) | OK |

## Assets That Could Not Be Downloaded

| Asset | Reason |
|-------|--------|
| logo-mark-full-colour (alt variant, ID bd6bc0) | Access Denied on CDN — using the bd6c40 variant instead (identical visual) |
| og-image.png | Referenced in meta tags but not hosted on CDN; may need to be created separately |

## HTML Updates Made

- **Nav logo**: Replaced CSS text-based logo (`div.nav__logo-mark` + `span`) with `<img>` tag pointing to `assets/images/logo-white-yellow.svg` across all 12 HTML files
- **Footer logo**: Replaced CSS text-based logo (`div.footer__logo-mark` + text) with `<img>` tag pointing to `assets/images/logo-mark-full-colour.svg` across all 12 HTML files
- **Social icons**: Replaced text characters (in, f, X) with `<img>` tags for LinkedIn, Facebook, and Twitter SVG icons across all 12 HTML files
- **About page images**: Added 3 content images (bottles.jpg, frame-graphic.avif, services-img-1.jpg) to the problem cards on about-maji.html

## CSS Updates

- Added `.nav__logo img` styles for proper sizing
- Added `.footer__logo img` styles for proper sizing
- Added `.footer__social a img` styles with hover opacity
- Added `.problem-card__image` styles for about page content images

## Existing Assets (unchanged)

- `assets/favicon.svg` — already present and working
