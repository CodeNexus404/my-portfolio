/**
 * Local re-implementation of `convex/react` for offline preview / backend removal.
 *
 * The frontend imports `{ ConvexReactClient, useQuery, useMutation, useAction,
 * useConvexAuth }` from "convex/react". This module provides the same names with
 * the same signatures, backed by an in-memory reactive store seeded from
 * `src/data/mock-backend.json`. No real Convex connection is ever opened.
 *
 * Wired in via the Vite alias `@` -> src in vite.config.ts, so the frontend
 * source stays byte-for-byte identical.
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import seed from "../src/data/mock-backend.json";

type Message = {
  _id: string;
  _creationTime: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  reply: string;
  repliedAt: number;
};

type User = {
  email: string;
  name: string;
  isAnonymous: boolean;
} | null;

type TerminalContent = {
  prompt: string;
  bootLines: { type: string; text: string }[];
  defaultCommands: string[];
};

type SiteContent = {
  hero: { constant: string; rotating: string[] };
  availability: string;
  about: string[];
  objective: string;
  socials: { label: string; href: string }[];
  resumeUrl: string;
  terminal: TerminalContent;
};

type Project = {
  _id: string;
  name: string;
  description: string;
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  order: number;
  shaderColors?: string[];
};

type State = {
  currentUser: User;
  messages: Message[];
  siteContent: SiteContent;
  projects: Project[];
  resumeStorageId: string | null;
  background: {
    mode: "shader" | "image";
    colorBack: string;
    colors: string[];
    softness: number;
    intensity: number;
    noise: number;
    speed: number;
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    shape: string;
    imageStorageId?: string;
  };
  backgroundImageUrl: string | null;
};

// ── Reactive store ──────────────────────────────────────────────────────────
// Seeded from JSON; mutations update it and notify subscribers so the UI
// re-renders live (mirroring Convex's reactive queries).
const state: State = {
  currentUser: (seed.currentUser as User) ?? null,
  messages: (seed.contactMessages as Message[]).map((m) => ({ ...m })),
  siteContent: (seed.siteContent as SiteContent) ?? {
    hero: { constant: "Stay", rotating: [] },
    availability: "Open to internships & full-time roles",
    about: [""],
    objective: "",
    socials: [],
    resumeUrl: "/resume.pdf",
  },
  projects: (seed.projects as Project[]).map((p) => ({ ...p })),
  resumeStorageId: null,
  background: {
    mode: "shader",
    colorBack: "#000000",
    colors: ["#00d8a8", "#00ffd4", "#00b4ff"],
    softness: 0.5,
    intensity: 0.3,
    noise: 0,
    speed: 1,
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    shape: "corners",
  },
  backgroundImageUrl: null,
};

const subscribers = new Set<() => void>();

function notify() {
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

// ── Client (no-op) ───────────────────────────────────────────────────────────
export class ConvexReactClient {
  url?: string;
  constructor(url?: string) {
    // Tolerates a missing VITE_CONVEX_URL — we never actually connect.
    this.url = url;
  }
}

// ── Query dispatch ────────────────────────────────────────────────────────────
// Matches the `name` strings defined in shim/api.ts.
function runQuery(name: string): unknown {
  switch (name) {
    case "users:currentUser":
      return state.currentUser;
    case "messages:listMessages":
      // Frontend expects `Doc<"contactMessages">[] | null`.
      return state.messages;
    case "content:getEditable": {
      // Frontend treats `null` as "unseeded"; seed JSON is always present here.
      const ordered = [...state.projects].sort((a, b) => a.order - b.order);
      return {
        content: {
          ...state.siteContent,
          terminal: state.siteContent.terminal ?? {
            prompt: "sahil@portfolio:~$",
            bootLines: [],
            defaultCommands: ["help", "whoami", "projects", "skills", "socials", "clear"],
          },
          resumeUrl: state.resumeStorageId
            ? `/resume-shim-${state.resumeStorageId}.pdf`
            : state.siteContent.resumeUrl,
        },
        projects: ordered.map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
          technologies: p.technologies,
          liveUrl: p.liveUrl || undefined,
          githubUrl: p.githubUrl || undefined,
          order: p.order,
          shaderColors: p.shaderColors,
          shaderParams: p.shaderParams,
        })),
        background: state.background,
        backgroundImageUrl: state.backgroundImageUrl,
      };
    }
    default:
      return undefined;
  }
}

export function useQuery(fn: { name: string }): unknown {
  // useSyncExternalStore gives us a stable snapshot per render so React's
  // StrictMode double-invoke and re-renders don't loop.
  const getSnapshot = useCallback(() => runQuery(fn.name), [fn.name]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ── Mutation / Action dispatch ───────────────────────────────────────────────
function runMutation(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case "messages:markAsRead": {
      const msg = state.messages.find((m) => m._id === args.id);
      if (msg) {
        msg.read = true;
        notify();
      }
      return null;
    }
    case "sendMessage:sendMessage": {
      const newMsg: Message = {
        _id: `msg_${Date.now()}`,
        _creationTime: Date.now(),
        name: String(args.name ?? ""),
        email: String(args.email ?? ""),
        message: String(args.message ?? ""),
        read: false,
        reply: "",
        repliedAt: 0,
      };
      state.messages = [newMsg, ...state.messages];
      notify();
      return newMsg._id;
    }
    case "sendReply:replyToMessage": {
      const msg = state.messages.find((m) => m._id === args.messageId);
      if (msg) {
        msg.reply = String(args.reply ?? "");
        msg.repliedAt = Date.now();
        msg.read = true;
        notify();
      }
      // Frontend checks `res.emailed` / `res.emailError`.
      return {
        saved: true,
        emailed: false,
        emailError:
          "RESEND_API_KEY is not set — reply saved locally but not emailed. (Convex backend removed.)",
      };
    }

    // ── Owner CMS (content) ───────────────────────────────────────────────
    case "content:updateHero": {
      state.siteContent.hero = {
        constant: String(args.constant ?? ""),
        rotating: Array.isArray(args.rotating) ? (args.rotating as string[]) : [],
      };
      notify();
      return null;
    }
    case "content:updateAvailability": {
      state.siteContent.availability = String(args.availability ?? "");
      notify();
      return null;
    }
    case "content:updateTerminal": {
      state.siteContent.terminal = {
        prompt: String(args.prompt ?? "sahil@portfolio:~$"),
        bootLines: Array.isArray(args.bootLines)
          ? (args.bootLines as { type: string; text: string }[]).map((l) => ({
              type: String(l.type ?? "output"),
              text: String(l.text ?? ""),
            }))
          : [],
        defaultCommands: Array.isArray(args.defaultCommands)
          ? (args.defaultCommands as string[]).map((c) => String(c))
          : [],
      };
      notify();
      return null;
    }
    case "content:updateBackground": {
      state.background = {
        mode: args.background?.mode === "image" ? "image" : "shader",
        colorBack: String(args.background?.colorBack ?? "#000000"),
        colors: Array.isArray(args.background?.colors)
          ? (args.background?.colors as string[]).map((c) => String(c))
          : ["#00d8a8", "#00ffd4", "#00b4ff"],
        softness: Number(args.background?.softness ?? 0.5),
        intensity: Number(args.background?.intensity ?? 0.3),
        noise: Number(args.background?.noise ?? 0),
        speed: Number(args.background?.speed ?? 1),
        scale: Number(args.background?.scale ?? 1),
        rotation: Number(args.background?.rotation ?? 0),
        offsetX: Number(args.background?.offsetX ?? 0),
        offsetY: Number(args.background?.offsetY ?? 0),
        shape: String(args.background?.shape ?? "corners"),
        ...(args.background?.imageStorageId
          ? { imageStorageId: String(args.background.imageStorageId) }
          : {}),
      };
      notify();
      return null;
    }
    case "content:setBackgroundImage": {
      const storageId = String(args.storageId ?? "");
      state.background = {
        ...state.background,
        mode: "image",
        imageStorageId: storageId,
      };
      // Mirrors the real backend: a shim placeholder URL is surfaced via
      // backgroundImageUrl so the preview can render the chosen image slot.
      state.backgroundImageUrl = `/background-shim-${storageId}.png`;
      notify();
      return null;
    }
    case "content:updateAboutObjective": {
      state.siteContent.about = Array.isArray(args.about)
        ? (args.about as string[])
        : [];
      state.siteContent.objective = String(args.objective ?? "");
      notify();
      return null;
    }
    case "content:updateSocials": {
      state.siteContent.socials = Array.isArray(args.socials)
        ? (args.socials as { label: string; href: string }[])
        : [];
      notify();
      return null;
    }
    case "content:upsertProject": {
      const technologies = Array.isArray(args.technologies)
        ? (args.technologies as string[])
        : [];
      const liveUrl = args.liveUrl ? String(args.liveUrl) : "";
      const githubUrl = args.githubUrl ? String(args.githubUrl) : "";
      const shaderColors = Array.isArray(args.shaderColors)
        ? (args.shaderColors as string[])
        : undefined;
      const id = args.id ? String(args.id) : `proj_${Date.now()}`;
      const existing = state.projects.find((p) => p._id === id);
      if (existing) {
        existing.name = String(args.name ?? existing.name);
        existing.description = String(args.description ?? existing.description);
        existing.technologies = technologies;
        existing.liveUrl = liveUrl;
        existing.githubUrl = githubUrl;
        if (shaderColors) existing.shaderColors = shaderColors;
      } else {
        const maxOrder = state.projects.reduce(
          (m, p) => Math.max(m, p.order),
          0,
        );
        state.projects.push({
          _id: id,
          name: String(args.name ?? "Untitled"),
          description: String(args.description ?? ""),
          technologies,
          liveUrl,
          githubUrl,
          order: maxOrder + 1,
          ...(shaderColors ? { shaderColors } : {}),
        });
      }
      notify();
      return id;
    }
    case "content:deleteProject": {
      state.projects = state.projects.filter((p) => p._id !== args.id);
      notify();
      return null;
    }
    case "content:reorderProject": {
      const dir = String(args.direction);
      const ordered = [...state.projects].sort((a, b) => a.order - b.order);
      const idx = ordered.findIndex((p) => p._id === args.id);
      if (idx !== -1) {
        const swap = dir === "up" ? idx - 1 : idx + 1;
        if (swap >= 0 && swap < ordered.length) {
          const a = ordered[idx];
          const b = ordered[swap];
          const tmp = a.order;
          a.order = b.order;
          b.order = tmp;
          notify();
        }
      }
      return null;
    }
    case "content:createUploadUrl": {
      // No real backend — return a fake upload endpoint.
      return `https://shim.local/upload/${Date.now()}`;
    }
    case "content:setResume": {
      // Record the fake storage id; getEditable will surface a placeholder URL.
      state.resumeStorageId = String(args.storageId ?? `s_${Date.now()}`);
      notify();
      return null;
    }
    case "content:resetResume": {
      state.resumeStorageId = null;
      notify();
      return null;
    }
    case "content:seedDefaults": {
      return null;
    }
    default:
      return null;
  }
}

export function useMutation(fn: { name: string }) {
  return useCallback(
    (args: Record<string, unknown> = {}) => runMutation(fn.name, args),
    [fn.name],
  );
}

export function useAction(fn: { name: string }) {
  // Actions in the real backend are async; keep the same contract here.
  return useCallback(
    async (args: Record<string, unknown> = {}) => runMutation(fn.name, args),
    [fn.name],
  );
}

// ── Auth state ────────────────────────────────────────────────────────────────
// We report the owner as signed-in so the preview can reach /dashboard and the
// inbox. To preview the locked/guest state, flip isAuthenticated to false.
export function useConvexAuth() {
  return { isLoading: false, isAuthenticated: true };
}

// Stubs for any other `convex/react` exports the app might pull in.
export function useConvex() {
  return null;
}
export const ConvexProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => children as React.ReactElement;
export const ConvexProviderWithAuth = ConvexProvider;
