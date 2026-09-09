import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The ONLY account allowed to read/reply to contact messages.
 * Set OWNER_EMAIL in the Convex environment (or the Keys/API keys UI) to your
 * real address; it falls back to the portfolio email. Anonymous/guest accounts
 * are always rejected.
 */
const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ?? "shedgesahil2005@gmail.com"
).toLowerCase();

type OwnerUser = { email?: string; isAnonymous?: boolean };

/** Load the signed-in user record, or null when signed out. */
async function getCurrentUser(ctx: QueryCtx): Promise<OwnerUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return { email: user.email ?? undefined, isAnonymous: user.isAnonymous };
}

function isOwner(user: OwnerUser | null) {
  return (
    !!user &&
    user.isAnonymous !== true &&
    !!user.email &&
    user.email.toLowerCase() === OWNER_EMAIL
  );
}

/** Throw unless the caller is the portfolio owner. */
async function requireOwner(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!isOwner(user)) {
    throw new Error(
      "Not authorized. Sign in with the owner account (email OTP, no guest sign-in).",
    );
  }
  return user;
}

/**
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
