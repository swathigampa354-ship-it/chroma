# CHROMA — Hair Transformation Copilot ✨

**Upload a selfie → get your personal hair-color palette, hair profile, and a virtual hair try-on — powered by the YouCam AI Beauty API.**

> Built for the **YouCam API Skin AI & Apparel VTO Hackathon**.

## 🌐 Try it live
**https://chroma.vercel.app**

## 🎯 Problem
Choosing a hair color is guesswork: salon charts are generic, online tools rarely show *your* face, and "try-on" apps either need a pro photo or just overlay a flat color. People waste money on colors that don't suit their skin tone.

## 💡 Solution
CHROMA turns a single selfie into a personal hair-color studio:
1. **📸 Upload a selfie** → YouCam analyzes your **skin tone, eye/lip/brow colors** (skin-tone-analysis) + **hair length/type** (hair-length analysis)
2. **🎨 Personal palette** → deterministic color-science engine picks shades that harmonize with your undertone (warm/cool/neutral) — not random colors
3. **💇 Virtual try-on** → YouCam **hair-color** renders your chosen shade on your actual face (before/after)
4. **📋 Hair profile + recommendations** → your strand profile + product picks, saved in your browser (IndexedDB)

## 🔧 How it works

```
Browser (React 19 + TS) ──► /api/youcam (Vercel serverless proxy)
                                │  key rotation · DEMO_MODE fallback
                                ▼
                          YouCam v2 API
                          - skin-tone-analysis (20u)
                          - hair-length detection (2u)
                          - hair-color try-on (1u)
                          - hair-bang templates (1u)
```

- **Privacy:** photos go straight to YouCam via the proxy; the API key never touches the browser.
- **Resilience:** `DEMO_MODE=1` (or no key) → a deterministic client-side demo replays the full flow, so the demo never dies.
- **Cost:** ~1–20 units per call; multi-key round-robin supported via `YOUCAM_API_KEYS`.

## 🛠️ Getting started

```bash
npm ci
# Vercel env: YOUCAM_API_KEY (or YOUCAM_API_KEYS=a,b,c) · optional DEMO_MODE=1
npm run dev        # local dev
npm run build      # production build
npm test           # engine unit tests (vitest)
```

## 🧪 Tests
- `src/engines/__tests__/palette.test.ts` — color-science engine (undertone → shades)
- `src/engines/__tests__/hairprofile.test.ts` — strand profile builder
- `src/engines/__tests__/recommender.test.ts` — product recommender
- `src/engines/__tests__/retail.test.ts` — retail/brand mapping

## 🏗️ Tech stack
React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · Zustand · IndexedDB (idb) · Vercel serverless functions · Vitest

## 📁 Structure
```
chroma/
├─ api/youcam.mjs          # Vercel proxy (key rotation, demo fallback, CORS)
├─ src/
│  ├─ engines/             # palette · hairprofile · recommender · retail (deterministic)
│  ├─ components/          # Hero, UploadCard, Palette, Profile, StyleStudio, TryOnStudio, Recommendations, Preferences
│  ├─ lib/                 # api client + store
│  └─ App.tsx
├─ public/
└─ README.md
```

## 📈 Future
- Real salon-schedule integration · e-commerce product links · multi-face support · HD analysis

## 👥 Team
*— add team names —*
