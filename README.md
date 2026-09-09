# Personal Portfolio

A designer-grade, single-page developer portfolio built as a **Vite + React 19 + TypeScript** app with a **Convex** backend (optional for local preview). It features a liquid-glass navbar, an animated shader backdrop, a fully interactive in-page terminal, scroll-reveal animations, and a cohesive "senior developer" type system.

---

## Tech Stack

| Layer        | Choice |
|--------------|--------|
| Build tool   | Vite 7 |
| Language     | TypeScript |
| UI framework | React 19 |
| Routing      | React Router v7 (`react-router`) |
| Styling      | Tailwind CSS v4 + Shadcn UI primitives |
| Icons        | Lucide React, Simple Icons, Font Awesome (brand logos) |
| Animation    | Framer Motion, GSAP, Lenis (smooth scroll), @paper-design/shaders-react (WebGL) |
| 3D / Shaders | Three.js + @react-three/fiber, WebGL gradients |
| Backend / DB | Convex (serverless) + Convex Auth (email OTP + anonymous) |
| Forms / PDF  | React Hook Form, Zod, jsPDF / pdf-lib |

All source lives under `src/`. Use **Bun** as the package manager (npm also works).

---

## Features

- **Hero** — animated availability badge, rotating status text, responsive headline.
- **Interactive Terminal** — a real in-page shell (`help`, `ls`, `open`, `projects`, `man`, history with ↑/↓, Tab completion, clickable links). Boots with a loading sequence.
- **About** — statement with word-reveal, animated stat counters, education timeline.
- **Skills & Stack** — marquee of technology chips with brand logos (Java, VS Code, etc.) sourced from Font Awesome / Simple Icons.
- **Experience & Work** — timeline + project cards with WebGL wave-shader headers and LIVE / GITHUB links.
- **Liquid-glass navbar** — frosted capsule with adaptive text color, scroll-progress bar, ⌘K-style hint.
- **Contact** — connected info + form card with glass submit button and toast feedback.
- **Smooth scrolling** — Lenis-driven, tuned for high-refresh displays.

---

## Prerequisites

- **Node.js** ≥ 20 (developed on Node 26)
- **Bun** ≥ 1.0 (recommended) — `npm install -g bun`
- *(optional)* a **Convex** deployment for the live backend; **not required** for local preview (see Offline mode).

---

## Setup

```bash
# 1. Clone / open the project
cd my-portfolio

# 2. Install dependencies
bun install          # or: npm install
```

That's it — there is **no `requirements.txt`** because this is a Node/Bun project; all dependencies are declared in `package.json` / `package-lock.json`.

---

## Running Locally

### Option A — Offline / preview mode (recommended for quick start)

The app runs **fully offline** with no Convex backend. When `VITE_CONVEX_URL` is unset, Vite aliases the Convex imports to a local in-memory **shim** (`shim/`) backed by `src/data/mock-backend.json`.

```bash
bun dev              # or: npm run dev
```

Open **http://localhost:5173**.

### Option B — Full Convex backend

1. Create / reuse a Convex deployment and download its `.env.local` (contains `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`) into the project root.
2. Start Convex + the app:

```bash
bunx convex dev      # pushes schema + functions, watches for changes
bun dev              # in a second terminal
```

With `VITE_CONVEX_URL` present, the app talks to your real deployment instead of the shim.

---

## Available Scripts

| Script            | Description |
|-------------------|-------------|
| `bun dev`         | Start the Vite dev server (port 5173). |
| `bun build`       | Type-check (`tsc -b`) then production build (`vite build`). |
| `bun preview`     | Preview the production build locally. |
| `bun lint`        | Run ESLint. |
| `bun format`      | Format with Prettier. |
| `bunx convex dev` | Run the Convex backend (dev loop). |

---

## Environment Variables

| Variable            | Used by | Purpose |
|---------------------|---------|---------|
| `CONVEX_DEPLOYMENT` | Convex  | Identifies your deployment. |
| `VITE_CONVEX_URL`   | Client  | When **set**, the app uses the real Convex backend; when **unset**, it falls back to the offline shim. |
| `JWKS` / `JWT_PRIVATE_KEY` / `SITE_URL` | Convex Auth | Auth signing keys for the backend. |

There is no `.env.local` committed; for local preview you don't need any of these.

---

## Authentication (already wired up)

- Built on **Convex Auth** with **email OTP** + **anonymous** users.
- **Do not modify** `src/convex/auth/emailOtp.ts`, `src/convex/auth.config.ts`, or `src/convex/auth.ts`.
- Frontend: use the `useAuth` hook — never read auth state manually.

```ts
import { useAuth } from "@/hooks/use-auth";
const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
```

- `/auth` is the sign-in / sign-up page; `/dashboard` is protected by `RequireAuth`.
- Backend: use `getCurrentUser` from `src/convex/users.ts`.

---

## Conventions (quick reference)

- **Pages** in `src/pages/`, **components** in `src/components/` (UI primitives in `src/components/ui/`).
- **Mobile responsive** and **light/dark** aware by default; prefer thin borders over shadows.
- **Animations**: Framer Motion for reveals; GSAP/Lenis for scroll.
- **Type system**: Inter (body), JetBrains Mono (labels/code), Instrument Serif (editorial display), Nasalization (section numerals), SF Pro Display (stats/headlines). Terminal keeps its own monospace font.
- **Convex**: schema in `src/convex/schema.ts`; external calls go in `"use node"` actions; reference docs as `Id<"Table">` / `Doc<"Table">`; never add return-type validators.

---

## Project Structure

```
my-portfolio/
├── index.html
├── vite.config.ts          # shim alias logic + chunking
├── src/
│   ├── main.tsx             # router + providers + font imports
│   ├── index.css            # theme tokens, liquid-glass utilities, fonts
│   ├── pages/               # Landing, Auth, Dashboard, NotFound
│   ├── components/
│   │   ├── ui/              # shadcn primitives
│   │   └── portfolio/       # Hero, Navbar, Terminal, WorkCard, Skills, …
│   ├── convex/              # schema, auth, functions, _generated
│   ├── data/portfolio.ts    # all site content (profile, projects, skills)
│   ├── hooks/               # use-auth, use-github-repos, …
│   └── lib/utils.ts
├── shim/                    # offline Convex stand-in (used when no VITE_CONVEX_URL)
├── public/                  # logo, resume, manifest
└── convex.json
```

---

## Build & Deploy

```bash
bun build                    # outputs to dist/
bun preview                  # serve the build locally
```

For production with a live backend, set `VITE_CONVEX_URL` (and the Convex auth env vars) in your host's environment, then build and deploy `dist/`.
