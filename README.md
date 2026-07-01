# Pokédex — Production Ready

A beautiful, fully-featured, production-quality Pokédex web application.

Built with React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, Lucide icons, and Sonner toasts.

## Features

- **Instant beautiful experience** — Dark cinematic UI, high-quality official artwork, smooth micro-interactions and modal animations
- **Powerful exploration** — Instant search (name or number), multi-select type filters, 9 generations + full National Dex
- **Advanced sorting** — ID, name, or highest HP
- **Favorites system** — Persistent via localStorage with dedicated view and count
- **Rich detail modal** — Large artwork, flavor text, animated stat bars, height/weight, abilities (hidden flagged), keyboard navigation (← → Esc)
- **Progressive loading** — Fast initial load of 180 Pokémon + seamless "Load more"
- **Fully client-side filtering** — Snappy even with hundreds loaded
- **Production hardened** — TypeScript strict, proper error states + retry, loading skeletons, abort-safe fetches, optimized build
- **Keyboard friendly** — Search focus, modal navigation, accessible interactions
- **Responsive** — Perfect on mobile, tablet, desktop

## Run locally

```bash
cd /home/marcus/pokedex
npm install
npm run dev
```

Open http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

The `dist/` folder contains a fully optimized static site ready for any hosting (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc).

## Tech

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (via Vite plugin)
- Framer Motion (modal + polish)
- Sonner (beautiful toasts)
- Lucide React icons
- PokéAPI (https://pokeapi.co) — all data fetched live on the client

## Architecture notes

- Strong typing for all Pokémon data
- In-memory cache + localStorage for favorites
- Client-side filtering/sorting for instant UX
- Progressive batch loading (no unnecessary upfront requests)
- Clean component extraction (Card, StatBar)

No external backend required. Everything is self-contained and deployable as static assets.

Enjoy exploring the world of Pokémon.
