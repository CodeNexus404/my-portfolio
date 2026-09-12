import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import {
  getCurrentUser,
  isOwner,
  requireOwner,
  ownerEmail,
} from "./guards";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact inbox helpers. Owner authorization is centralized in ./guards.ts
 * (OWNER_EMAIL env var with the portfolio-email fallback). The email check in
 * sendReply.ts compares against the same owner email via guards.ownerEmail().
 *
 * Store a contact-form submission. Public on purpose — visitors send this
 * without an account. Inputs are trimmed and length-capped server-side.
 */
export const sendMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 120);
    const email = args.email.trim().slice(0, 200);
    const message = args.message.trim().slice(0, 4000);

    if (!name || !email || !message) {
      throw new Error("Please fill in all fields.");
    }
    if (!EMAIL_RE.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    return await ctx.db.insert("contactMessages", {
      name,
      email,
      message,
      read: false,
    });
  },
});

/**
 * Contact inbox — ONLY the owner can read it. Returns null for everyone else
 * (guests and signed-out visitors), so the UI can show a friendly notice
 * instead of an error.
 */
export const listMessages = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!isOwner(user)) return null;
    return await ctx.db.query("contactMessages").order("desc").take(50);
  },
});

/** Mark a message as read (owner only). */
export const markAsRead = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await ctx.db.patch(args.id, { read: true });
  },
});

// ── Internal helpers used by the "use node" reply action ─────────────

export const getUserInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return { email: user.email ?? null, isAnonymous: user.isAnonymous };
  },
});

export const getMessageInternal = internalQuery({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const applyReplyInternal = internalMutation({
  args: { id: v.id("contactMessages"), reply: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      reply: args.reply.slice(0, 4000),
      repliedAt: Date.now(),
      read: true,
    });
  },
});
