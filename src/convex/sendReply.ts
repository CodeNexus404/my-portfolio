"use node";

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ?? "shedgesahil2005@gmail.com"
).toLowerCase();

/**
 * Reply to a contact message — owner only.
 * 1. Saves the reply onto the message (visible in the inbox thread).
 * 2. Emails it to the visitor through Resend when RESEND_API_KEY is set.
 *    Without the key (or before a verified domain), the reply is still saved
 *    and `emailed` comes back false.
 */
export const replyToMessage = action({
  args: {
    messageId: v.id("contactMessages"),
    reply: v.string(),
  },
  handler: async (ctx, args) => {
    // ── Owner check ──────────────────────────────────────────────
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in required.");
    const user = await ctx.runQuery(internal.messages.getUserInternal, {});
    if (
      !user ||
      user.isAnonymous === true ||
      !user.email ||
      user.email.toLowerCase() !== OWNER_EMAIL
    ) {
      throw new Error("Not authorized.");
    }

    const reply = args.reply.trim().slice(0, 4000);
    if (!reply) throw new Error("Reply cannot be empty.");

    // ── Load the original message ────────────────────────────────
    const message = await ctx.runQuery(internal.messages.getMessageInternal, {
      id: args.messageId,
    });
    if (!message) throw new Error("Message not found.");

    // ── Persist the reply on the thread ──────────────────────────
    await ctx.runMutation(internal.messages.applyReplyInternal, {
      id: args.messageId,
      reply,
    });

    // ── Email it out via Resend ──────────────────────────────────
    let emailed = false;
    let emailError: string | undefined;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      emailError =
        "RESEND_API_KEY is not set — reply saved but not emailed yet.";
    } else {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // onboarding@resend.dev works without domain verification while
            // testing; verify your own domain in Resend to deliver reliably.
            from: `Sahil Shedge <onboarding@resend.dev>`,
            to: [message.email],
            reply_to: "shedgesahil2005@gmail.com",
            subject: "Re: your message from sahilshedge.dev",
            text: `Hi ${message.name},\n\n${reply}\n\n— Sahil Shedge\nhttps://github.com/CodeNexus404`,
          }),
        });
        if (res.ok) {
          emailed = true;
        } else {
          const body = (await res.json().catch(() => null)) as
            | { message?: string }
            | null;
          emailError = body?.message ?? `Resend responded ${res.status}.`;
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : "Network error.";
      }
    }

    return { saved: true as const, emailed, emailError };
  },
});
