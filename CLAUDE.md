# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rayna's personal blog — a static site hosted on GitHub Pages at `rayna1010.github.io`. Written in vanilla HTML/CSS/JS (no frameworks, no build tools, no package manager). Language is Chinese (zh-CN).

## Architecture

**Pages:** `index.html` (Home/Essays), `archive.html` (Timeline), `about.html`, `social.html`

**Shared assets:**
- `css/style.css` — single stylesheet, theming via `data-theme` attribute on `<html>`
- `js/blog.js` — loaded on every page; handles dark/light theme toggle and auth system
- `js/archive.js` — timeline entries (only on archive.html)
- `js/essays.js` — essay cards (only on index.html)

**Data storage:** All user content lives in `localStorage`:
- `rayna-archive` — archive timeline entries (JSON)
- `rayna-essays` — essays (JSON)
- `blog-theme` — theme preference
- `blog-auth` / `blog-passhash` — auth state

**Auth system:** `blog.js` exposes `window.__blogAuth` with `isUnlocked()`, `onAuthChange(fn)`, and `refreshUI()`. Other scripts check auth to show/hide edit controls. Auth state persists in `sessionStorage`; the lock/unlock toggle is injected into the nav bar.

**JS pattern:** All scripts use IIFEs — no ES modules. `blog.js` must load first as it sets up `window.__blogAuth` that `archive.js` and `essays.js` depend on.

## Development

No build step required. Open HTML files directly in a browser, or serve locally:

```bash
npx serve .
# or
python -m http.server 8000
```

Deploy by pushing to `master` — GitHub Pages auto-publishes.

## Key Conventions

- Each page has the same nav structure with an `active` class on the current page link
- Every page loads `blog.js` first, then its page-specific script
- `data-theme="dark"` / `data-theme="light"` on `<html>` drives theming via CSS variables
- `data-editable="1"` / `data-editable="0"` on `<html>` controls edit-mode visibility
- File uploads are base64-encoded and stored in localStorage (4MB image limit, 5MB file limit)
