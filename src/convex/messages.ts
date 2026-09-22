import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser, isOwner, requireOwner, ownerEmail } from "./guards";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Internal insert used by the sendMessage action — a plain mutation cannot
 * run process.env (fetch/Node) so the storage half lives here, callable from
 * the action via ctx.runMutation.
 */
export const insertMessageInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contactMessages", {
      name: args.name,
      email: args.email,
      message: args.message,
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

/** Delete a single contact message (owner only). */
export const deleteMessage = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    await ctx.db.delete(args.id);
  },
});

/** Delete multiple contact messages at once (owner only). Returns count deleted. */
export const deleteMessages = mutation({
  args: { ids: v.array(v.id("contactMessages")) },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    let deleted = 0;
    for (const id of args.ids) {
      const existing = await ctx.db.get(id);
      if (existing) {
        await ctx.db.delete(id);
        deleted += 1;
      }
    }
    return deleted;
  },
});

/** Mark multiple messages read/unread at once (owner only). Returns count updated. */
export const markMessages = mutation({
  args: {
    ids: v.array(v.id("contactMessages")),
    read: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    let updated = 0;
    for (const id of args.ids) {
      const existing = await ctx.db.get(id);
      if (existing && existing.read !== args.read) {
        await ctx.db.patch(id, { read: args.read });
        updated += 1;
      }
    }
    return updated;
  },
});

/**
 * One-time helper to populate the inbox with example messages for testing the
 * dashboard. Owner only. Inserts two realistic threads; safe to run repeatedly
 * (it only adds — use the dashboard to delete them afterwards).
 */
export const seedTestMessages = mutation({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const samples: { name: string; email: string; message: string }[] = [
      {
        name: "Priya Nair",
        email: "priya.nair@outlook.com",
        message:
          "Hi! I'm a recruiter at a fintech startup looking for a full-stack dev with React + Convex experience. Your terminal contact section is genius. Would you be interested in a 30-min intro call this week? Happy to share more details.",
      },
      {
        name: "Arjun Mehta",
        email: "arjun.mehta@gmail.com",
        message:
          "Hey Sahil — came across your portfolio via the shadcn community. I'm building a realtime collab whiteboard and would love your input on the sync layer. Are you open to a quick chat or consulting on the side?",
      },
    ];
    for (const s of samples) {
      await ctx.db.insert("contactMessages", {
        name: s.name,
        email: s.email,
        message: s.message,
        read: false,
      });
    }
    return samples.length;
  },
});

/**
 * Email-sending health for the dashboard Resend checklist. Owner only. Reports
 * whether RESEND_API_KEY is configured and what sender is in use, so the owner
 * can see at a glance whether replies will actually be emailed out.
 */
export const emailStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!isOwner(user)) return null;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    // The test sender works without domain verification; a verified domain is
    // needed for reliable delivery to real inboxes.
    const usingTestSender = !from || from.includes("onboarding@resend.dev");
    return {
      configured: Boolean(apiKey),
      from: from ?? "Sahil Shedge <onboarding@resend.dev>",
      usingTestSender,
    };
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
