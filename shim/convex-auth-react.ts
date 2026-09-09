/**
 * Local re-implementation of `@convex-dev/auth/react`.
 *
 * The frontend imports `{ ConvexAuthProvider, useAuthActions }` from here. This
 * module provides the same names so the app compiles and runs offline with no
 * real auth backend. `ConvexAuthProvider` simply renders its children; sign-in
 * / sign-out are no-ops (the auth UI still renders, it just won't talk to a
 * server). Wired in via the Vite alias in vite.config.ts.
 */

import type { ReactNode } from "react";

export function ConvexAuthProvider({
  children,
}: {
  client?: unknown;
  children: ReactNode;
}) {
  return children as React.ReactElement;
}

export function useAuthActions() {
  return {
    signIn: async (_provider?: unknown, _params?: unknown) => undefined,
    signOut: async () => undefined,
    signUp: async (_provider?: unknown, _params?: unknown) => undefined,
  };
}

// `useAuth` from @convex-dev/auth/react is not used by this app (it uses
// src/hooks/use-auth.ts instead), but provide a passthrough to be safe.
export function useAuth() {
  return { isLoading: false, isAuthenticated: true, user: null };
}
