# maji by majaco — Agent Reference

## About majaco & maji

- **majaco** (https://majaco.co) is an operational improvement consultancy, previously Newton Europe
- **maji** is majaco's AI operational analyst — the tools on this site are maji's public and client-facing outputs
- Use **UK English** throughout (colour not color, optimise not optimize, analyse not analyze)

## Proprietary Frameworks — Use These, Not Alternatives

When building or modifying tool pages, use majaco's terminology and frameworks:

| majaco Framework | NEVER Use Instead |
|---|---|
| **Lost Time** (LTSR, LTMW, Good Output) | OEE = Availability × Performance × Quality |
| **EPA** (Efficiency, Pareto, Action) | Generic problem-solving frameworks |
| **Split Solving** | Fishbone diagrams, 5 Whys |
| **Valuation of Opportunities** (production vs sales-constrained) | Generic ROI approaches |

If building a tool that touches these concepts, use majaco's approach. If unsure whether majaco has a proprietary method, flag it rather than defaulting to textbook approaches.

## External Knowledge — Notion

majaco's Knowledge Base is a living system in Notion. **Fetch it on every query where domain context is needed** — do not rely on cached or stale knowledge.

- **Knowledge Base Index**: Notion page `id="2924f4a74df081a89b8af9fc8725405b"` — start here, it indexes everything
- **Notion Changelog**: database `id="2924f4a74df0807cbc85fd151bdc5445"`
- Use Notion tools to fetch if available; otherwise ask the user
- For client context, active engagements, or CRM data — ask the user, this repo is not the source of truth

## Repository

- **Remote**: `https://github.com/Jamie-Diamond/maji-site.git`
- **Branch**: `main` (deploy branch)
- **Hosting**: GitHub Pages at `majiai.co`

## Site Structure

```
maji-site/
├── index.html                  # Public homepage
├── about-maji.html             # About page
├── protected-tools.html        # Password gate (master: requires maji_auth)
├── clients.html                # Client portal password entry
├── privacy-policy.html
├── maji-sitemap.html
│
├── css/                        # Shared maji stylesheets
│   ├── variables.css
│   └── style.css
├── js/
│   ├── main.js                 # Nav, hamburger, scroll behaviour
│   ├── auth-gate.js            # Master password overlay (creates UI, hashes & checks)
│   ├── auth-redirect.js        # Bounces to /protected-tools.html if not authed
│   └── client-redirect.js      # Bounces to /clients.html if client hash missing
├── assets/
│   ├── fonts/                  # TT Hoves Pro (Light, Regular, Bold)
│   └── images/                 # Logos, favicons
│
├── maji-*.html                 # Public tools (speed-downtime, splitsolver, etc.)
├── mhw-simulator.html          # Multihead weigher simulator
│
├── becketts/                   # Becketts Foods client portal (password-protected)
│   ├── index.html
│   ├── run-rate-calculator.html
│   ├── performance-framework.html
│   ├── 3pl-cold-storage-calculator.html
│   └── pack-weight-distributions.html
│
├── nineten/                    # Nine/Ten (Clyde Fasteners) client portal
│   ├── index.html
│   └── operational-roadmap.html  # Content is base64-encoded, decoded client-side
│
├── pukka/                      # Pukka client portal
│   └── index.html
│
└── redzone/                    # RedZone client portal
    ├── index.html
    └── partnership-workshop.html
```

## Authentication

Two-layer auth system using SHA-256 hashes stored in sessionStorage.

### Layer 1 — Master gate (`maji_auth`)
- `auth-gate.js` renders a password overlay, hashes input, stores in `sessionStorage['maji_auth']`
- `auth-redirect.js` checks for `maji_auth` OR `maji_client_auth` — redirects to `/protected-tools.html` if neither exists
- Used on all protected pages

### Layer 2 — Client gate (`maji_client_auth`)
- `clients.html` hashes the client password, stores in `sessionStorage['maji_client_auth']`, redirects to the matching portal
- `client-redirect.js` checks `maji_client_auth` matches the page's `data-password-hash` attribute — redirects to `/clients.html` if not
- Used on all client portal pages

### Client password hashes
Passwords are NOT stored in this repo. Hashes are in each page's `data-password-hash` attribute and in `clients.html`. If you need a password, ask the user.

### Adding a new client portal
1. Generate hash: `echo -n "thepassword" | shasum -a 256`
2. Create `clientname/index.html` with auth scripts:
   ```html
   <script src="../js/auth-redirect.js"></script>
   <script src="../js/client-redirect.js" data-password-hash="THE_HASH"></script>
   ```
3. Add the hash → URL mapping in `clients.html` PORTALS array
4. Add a portal card on the client's `index.html`

## Branding & Styling

- **Font**: TT Hoves Pro (loaded from `assets/fonts/`)
- **Colours**: dark green `#001412`, pine `#006458`, lime `#DAF11B`
- **Background**: dark (`#001412`)
- **Shared CSS**: `css/variables.css` + `css/style.css`

## Page Template (client portal pages)

All client portal pages follow this pattern:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title — majaco</title>
  <script src="../js/auth-redirect.js"></script>
  <script src="../js/client-redirect.js" data-password-hash="CLIENT_HASH"></script>
  <link rel="stylesheet" href="../css/variables.css">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">
  <style>
    /* Page-specific styles */
  </style>
</head>
<body>
  <!-- Nav, hero, content, footer — see becketts/index.html for reference -->
  <script src="../js/main.js"></script>
</body>
</html>
```

## Key Conventions

- **UK English** — all copy, labels, tooltips, and comments
- **No build step** — all pages are static HTML, edit and push
- **Inline CSS/JS** — tool pages are self-contained; shared styles only in `css/`
- **Auth scripts go in `<head>`** — they must run before page renders
- **Google Fonts** are NOT used on maji pages (TT Hoves Pro is self-hosted)
- **Disclaimers** — maji client pages should include a disclaimer banner after the breadcrumb
- **base64-encoded content** — `nineten/operational-roadmap.html` encodes its HTML content in base64, decoded client-side after auth check. This is a content-protection pattern.
- **majaco terminology** — use proprietary frameworks (see table above), not textbook alternatives

## Git Workflow

- Push directly to `main` — GitHub Pages deploys automatically
- Remote may drift if others push — use `git pull --rebase origin main` before pushing
- The remote sometimes drops from the local config — re-add with:
  ```
  git remote add origin https://github.com/Jamie-Diamond/maji-site.git
  ```

## Common Tasks

### Adding a tool to a client portal
1. Create the HTML file in the client's folder (e.g. `becketts/new-tool.html`)
2. Include auth scripts and shared CSS (see template above)
3. Add a portal card linking to it in the client's `index.html`

### Updating shared styles
- Edit `css/variables.css` for colour/font variables
- Edit `css/style.css` for shared component styles
- Changes cascade to all pages that link these files

### Testing auth locally
- Open the site, enter master password, then client password
- Or set sessionStorage manually in browser console:
  ```js
  sessionStorage.setItem('maji_client_auth', 'THE_HASH');
  ```
