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
  },
  sendMessage: {
    sendMessage: node("sendMessage:sendMessage"),
  },
  sendReply: {
    replyToMessage: node("sendReply:replyToMessage"),
  },
  content: {
    getEditable: node("content:getEditable"),
    updateHero: node("content:updateHero"),
    updateAvailability: node("content:updateAvailability"),
    updateTerminal: node("content:updateTerminal"),
    updateBackground: node("content:updateBackground"),
    setBackgroundImage: node("content:setBackgroundImage"),
    updateAboutObjective: node("content:updateAboutObjective"),
    updateSocials: node("content:updateSocials"),
    upsertProject: node("content:upsertProject"),
    deleteProject: node("content:deleteProject"),
    reorderProject: node("content:reorderProject"),
    createUploadUrl: node("content:createUploadUrl"),
    setResume: node("content:setResume"),
    resetResume: node("content:resetResume"),
    seedDefaults: node("content:seedDefaults"),
  },
};

export type Api = typeof api;
