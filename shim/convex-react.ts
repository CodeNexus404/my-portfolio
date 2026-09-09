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

type State = {
  currentUser: User;
  messages: Message[];
};

// ── Reactive store ──────────────────────────────────────────────────────────
// Seeded from JSON; mutations update it and notify subscribers so the UI
// re-renders live (mirroring Convex's reactive queries).
const state: State = {
  currentUser: (seed.currentUser as User) ?? null,
  messages: (seed.contactMessages as Message[]).map((m) => ({ ...m })),
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
    case "messages:sendMessage": {
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
