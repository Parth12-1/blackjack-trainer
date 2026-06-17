# Deployment Guide

Both paths are configured. Auto-deploys on every push to `main`.

---

## Path A — Vercel (primary, custom domain support)

**Live URL (after one-time setup):** `https://blackjack-trainer.vercel.app`

### One-time setup

1. Go to https://vercel.com and sign in with GitHub.
2. Click "Add New Project" → "Import Git Repository".
3. Select `Parth12-1/blackjack-trainer`.
4. Vercel auto-detects Vite. Confirm:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click "Deploy".

After that, every `git push origin main` triggers a new deploy automatically.

The `vercel.json` at the repo root rewrites all routes to `/index.html` (required for SPAs).

---

## Path B — GitHub Pages (zero-config, live now)

**Live URL:** `https://Parth12-1.github.io/blackjack-trainer/`

### One-time setup (GitHub Settings)

1. Go to https://github.com/Parth12-1/blackjack-trainer/settings/pages
2. Under "Build and deployment" → Source, select **GitHub Actions**.
3. Save. The workflow at `.github/workflows/deploy.yml` runs automatically on every push to `main`.

The workflow sets `GITHUB_PAGES=true` so Vite builds with `base: '/blackjack-trainer/'`, ensuring all assets load at the correct path.

### Redeploy

Just run:

```
git push origin main
```

GitHub Actions picks it up and the Pages site updates within ~60 seconds.

---

## How `base` is handled

`vite.config.ts` conditionally sets:
- `base: '/blackjack-trainer/'` when `GITHUB_PAGES=true` (Pages workflow)
- `base: '/'` otherwise (Vercel + local dev)

This means both targets build correctly from the same source with no manual changes.
