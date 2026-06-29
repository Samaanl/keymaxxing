# PixRecall 🐱💧

A fast, clean, early-2000s-flavored **grid-recognition puzzle game** built with Next.js.
A drooling-cat meme is split into a grid; a conveyor belt scrolls zoomed-in chunks of it —
tap the matching tile before each chunk slides off the belt. Five memes = five levels, each
with four sub-levels of rising grid density and belt speed.

Built to be **instant-loading, fully static, offline-capable, and mobile-first** — no backend,
no database, no environment variables.

## Features

- **5 levels × 4 sub-levels** (3×3 → 4×4 → 6×6 → 8×8), rising belt speed & chunk count
- **Sub-level select** per level — jump straight to any unlocked sub-level (progress persists; no replaying cleared ones after a refresh)
- In-play **Restart (↻)** and **Quit (⌂)** controls — bail or retry instantly, no need to finish
- Campaign progression with **unlocks** + **Speedrun Mode** (all levels, one continuous clock)
- Scoring with **streak multipliers**, per-sub-level **quota**, hidden **1–3 star** ratings
- **Speedrun-only** seven-segment timer (no clock pressure in normal play), S/A/B/C/F **letter grades** (precision-based, so wrong clicks hurt)
- **Share your score**: a branded, on-theme **score card** (native share / save PNG / copy
  Wordle-style results / post to X) — replaces an online leaderboard
- **100% procedural audio** (Web Audio): synthesized SFX + a looping chiptune. Zero audio files.
- **GoatCounter** analytics (pageviews + custom events)
- **PWA**: installable, offline, instant return visits
- Responsive portrait / landscape / desktop layouts; 44px-friendly touch targets
- All tiles & belt chunks are cropped in-canvas from a single image — **no extra HTTP requests**

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000  (PWA disabled for fast HMR)
npm run build        # production build (generates the service worker)
npm start            # serve the production build
```

Requires Node 18.18+ (built/tested on Node 22).

## Deploy to Vercel

This is a zero-config static Next.js app — **no env vars required**.

1. Push this folder to a GitHub repo (it is the repo root — `package.json` is here) or run `vercel`.
2. Import it on [vercel.com](https://vercel.com) → Framework preset **Next.js** → Deploy.

A `vercel.json` pins the framework to `nextjs`, so Vercel builds with `next build` (output `.next`).

> **If you saw `No Output Directory named "dist" found`:** Vercel's Framework Preset was set to
> "Other" (which expects a `dist/` folder). The included `vercel.json` fixes this — just redeploy.
> If it persists, open **Settings → Build & Output Settings** and set **Framework Preset = Next.js**
> and leave **Output Directory** on its default (empty), then redeploy.

That's it. The 5 images live in `public/images/` and are precached by the service worker.

## Analytics (GoatCounter)

Pageviews and custom events are sent to **`https://pix.goatcounter.com`** (site code `pix`),
wired in `app/layout.tsx` and `lib/analytics.ts`.

- ✅ The only thing to confirm: your GoatCounter **site code is `pix`**. If it's different,
  change the two `pix.goatcounter.com` references in `app/layout.tsx` and `lib/brand.ts`.
- Events tracked: game/speedrun start, level reached, sub-level cleared, level/run complete,
  share clicked, and a bucketed session length.
- Note: GoatCounter intentionally **does not count `localhost`** — you'll see hits only on the
  deployed site.
- The on-page "visitor counter" was intentionally left out (no dashboard setup needed).

## Project layout

```
app/            layout, page, global styles, fonts
components/      screens/ game/ hud/ share/ ui/ + GameRoot (state machine) + AudioProvider
lib/            engine/ (GameEngine), imageCropper, levels, scoring, persistence,
                audio/ (procedural), share, analytics, runClock, brand
hooks/          useGameEngine, useImageLoader, useLayoutMode
public/images/  the 5 drooling-cat memes (level1..level5)
```

## Secret developer mode

For testing end-game features (share card, grades, etc.) without grinding:

1. On the landing screen, **tap the bottom-right corner 5 times** (invisible hotspot).
2. Enter the access code **`DROOL`**.

A green **DEV MODE** badge appears (tap it to turn off). While dev mode is on:

- **All levels & sub-levels unlock** so you can jump anywhere.
- During play, the **correct tile(s) glow green** as a guide.
- A green **WIN** button instantly clears the current sub-level as a perfect pass — chain it
  to reach the End screen + score card in seconds.

The code is defined in `components/screens/LandingScreen.tsx` (`DEV_CODE`).

## Tuning difficulty

All difficulty knobs are in [`lib/levels.ts`](lib/levels.ts): grid size, belt capacity, quota,
and `chunkSeconds` (time for a chunk to cross the belt), plus a per-level speed factor.

## Deferred (easy to add later)

Daily Challenge, Ghost Replay, and an online leaderboard were intentionally scoped out of this
build. The architecture leaves room for each (e.g. a seeded RNG for daily, a cursor-trail
recorder for ghosts).
