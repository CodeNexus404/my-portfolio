# Personal Portfolio

A designer-grade, single-page developer portfolio built as a **Vite + React 19 + TypeScript** app with a **Convex** backend. It features a liquid-glass navbar, an animated shader backdrop, a fully interactive in-page terminal, scroll-reveal animations, and a cohesive "senior developer" type system.

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

All source lives under `src/`. Package manager: **npm**.

---

## Features

- **Hero** — animated availability badge, rotating status text, responsive headline.
- **Interactive Terminal** — a real in-page shell (`help`, `ls`, `open`, `projects`, `man`, history with ↑/↓, Tab completion, clickable links). Boots with a loading sequence.
- **About** — statement with word-reveal, animated stat counters, education timeline.
- **Skills & Stack** — marquee of technology chips with brand logos (Java, VS Code, etc.) sourced from Font Awesome / Simple Icons, on a static black card background.
- **Experience & Work** — timeline + project cards with WebGL wave-shader headers and LIVE / GITHUB links.
- **Liquid-glass navbar** — frosted capsule with adaptive text color, scroll-progress bar, ⌘K-style hint.
- **Contact** — connected info + form card with glass submit button and toast feedback. Submissions land in the backend and can be replied to by email.
- **Smooth scrolling** — Lenis-driven, tuned for high-refresh displays.

---

## Prerequisites

- **Node.js** ≥ 20
- **npm** (ships with Node)
- A free **Convex** deployment for the live backend (see Setup).

---

## Setup

```bash
# 1. Clone / open the project
cd my-portfolio

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
#   then fill in VITE_CONVEX_URL (see Running Locally)
```

---

## Running Locally

### Option A — Offline / preview mode (quick start, no backend)

When `VITE_CONVEX_URL` is **unset**, the app runs fully offline using a local
in-memory **shim** (`shim/`) seeded from `src/data/mock-backend.json`.

```bash
npm run dev
```

Open **http://localhost:5173**.

### Option B — Full Convex backend

1. Create / reuse a Convex deployment and download its `.env.local`
   (contains `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`) into the project root:
   ```bash
   npx convex dev
   ```
2. Start Convex + the app:
   ```bash
   npx convex dev     # pushes schema + functions, watches for changes
   npm run dev        # in a second terminal
   ```

With `VITE_CONVEX_URL` present, the app talks to your real deployment instead of the shim.

---

## Available Scripts

| Script            | Description |
|-------------------|-------------|
| `npm run dev`     | Start the Vite dev server (port 5173). |
| `npm run build`   | Type-check (`tsc -b`) then production build (`vite build`). |
| `npm run preview` | Preview the production build locally. |
| `npm run lint`    | Run ESLint. |
| `npm run format`  | Format with Prettier. |
| `npx convex dev`  | Run the Convex backend (dev loop). |

---

## Environment Variables

| Variable            | Used by | Purpose |
|---------------------|---------|---------|
| `CONVEX_DEPLOYMENT` | Convex  | Identifies your deployment. |
| `VITE_CONVEX_URL`   | Client  | When **set**, the app uses the real Convex backend; when **unset**, it falls back to the offline shim. |
| `JWKS` / `JWT_PRIVATE_KEY` / `SITE_URL` | Convex Auth | Auth signing keys for the backend. |
| `OWNER_EMAIL`      | Backend | Email allowed to access the owner workspace at `/dashboard`. Set this to **your** email or the workspace stays locked to the original owner. |
| `RESEND_API_KEY` / `RESEND_FROM` | Convex (email) | Optional. Powers email-OTP sign-in **and** reply emails via your own Resend account. Without it, sign-in codes can't be emailed. Verify a domain in Resend and set `RESEND_FROM` to a sender on it for reliable delivery (falls back to Resend's `onboarding@resend.dev` test sender). |

There is no `.env.local` committed; for local preview you only need `VITE_CONVEX_URL`.

---

## Authentication

- Built on **Convex Auth** with **email OTP** + **anonymous** users. OTPs are emailed through your own **Resend** account when `RESEND_API_KEY` is set (falls back to Resend's test sender `onboarding@resend.dev`).
- Frontend: use the `useAuth` hook — never read auth state manually.

```ts
import { useAuth } from "@/hooks/use-auth";
const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth();
```

- `/auth` is the sign-in / sign-up page; `/dashboard` is protected by `RequireAuth`.

---

## Owner Workspace

The site has an owner workspace at **`/dashboard`** where the site owner can manage
content. Sign in at `/auth` with the email set as `OWNER_EMAIL`, then open
`/dashboard`. (Requires a live Convex backend — see Setup.)

---

## Conventions (quick reference)

- **Pages** in `src/pages/`, **components** in `src/components/` (UI primitives in `src/components/ui/`).
- **Mobile responsive** and **light/dark** aware by default; prefer thin borders over shadows.
- **Animations**: Framer Motion for reveals; GSAP/Lenis for scroll.
- **Type system**: Inter (body), JetBrains Mono (labels/code), Instrument Serif (editorial display). Terminal keeps its own monospace font.
- **Convex**: schema in `src/convex/schema.ts`; external calls go in `"use node"` actions; reference docs as `Id<"Table">` / `Doc<"Table">`.

---

## Project Structure

```
my-portfolio/
├── index.html
├── vite.config.ts          # shim alias logic + chunking
├── src/
│   ├── main.tsx            # router + providers + font imports
│   ├── index.css           # theme tokens, liquid-glass utilities, fonts
│   ├── pages/              # Landing, Auth, Dashboard, NotFound
│   ├── components/
│   │   ├── ui/             # shadcn primitives
│   │   └── portfolio/      # Hero, Navbar, Terminal, WorkCard, Skills, …
│   ├── convex/             # schema, auth, functions, _generated
│   ├── data/portfolio.ts   # all site content (profile, projects, skills)
│   ├── hooks/              # use-auth, …
│   └── lib/utils.ts
├── shim/                   # offline Convex stand-in (used when no VITE_CONVEX_URL)
├── public/                 # logo, resume, manifest
└── convex.json
```

---

## Build & Deploy

```bash
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

For production with a live backend, set `VITE_CONVEX_URL` (and the Convex auth env
vars) in your host's environment, then build and deploy `dist/` to a static host
(e.g. Vercel). Deploy backend code with `npx convex deploy`.

---

## License

MIT — feel free to fork and make it yours.
