/**
 * Local Convex-compatible `api` surface.
 *
 * This mirrors ONLY the public function references the frontend imports. Each
 * leaf is a node whose `.name` identifies it; the shim's `useQuery` /
 * `useMutation` / `useAction` implementations dispatch on that name. No network
 * call is ever made — the frontend keeps working exactly as written.
 *
 * NOTE: This file replaces `src/convex/_generated/api` via the Vite alias in
 * vite.config.ts. It is NOT part of the frontend source; no component under
 * src/pages, src/components, or src/hooks is touched.
 */

type FnNode = { name: string };

const node = (name: string): FnNode => ({ name });

export const api = {
  users: {
    currentUser: node("users:currentUser"),
  },
  messages: {
    listMessages: node("messages:listMessages"),
    markAsRead: node("messages:markAsRead"),
    sendMessage: node("messages:sendMessage"),
  },
  sendReply: {
    replyToMessage: node("sendReply:replyToMessage"),
  },
};

export type Api = typeof api;
