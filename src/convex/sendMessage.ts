"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { ownerEmail } from "./guards";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Store a contact-form submission AND email the owner via Resend.
 * Public on purpose — visitors send this without an account.
 * Inputs are trimmed and length-capped server-side.
 *
 * This is a "use node" action because it emails the site owner through Resend,
 * which needs process.env access. The message is stored to the dashboard inbox
 * AND emailed to the owner, so nothing slips through even if the visitor never
 * returns to the site.
 */
export const sendMessage = action({
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

    // ── Persist to the dashboard inbox ──────────────────────────────
    const id = await ctx.runMutation(internal.messages.insertMessageInternal, {
      name,
      email,
      message,
    });

    // ── Email the owner a notification via Resend ───────────────────
    let emailed = false;
    let emailError: string | undefined;
    const apiKey = process.env.RESEND_API_KEY;
    // RESEND_FROM lets you control the sender without redeploying; falls back to
    // the test sender (onboarding@resend.dev) when unset. Verify your own domain
    // in Resend to deliver reliably to real inboxes.
    const from =
      process.env.RESEND_FROM ?? `Sahil Shedge <onboarding@resend.dev>`;
    if (!apiKey) {
      emailError =
        "RESEND_API_KEY is not set — message saved to inbox but not emailed.";
    } else {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [ownerEmail()],
            reply_to: email,
            subject: `New message from ${name} — sahilshedge.dev`,
            text: `You got a new message on sahilshedge.dev\n\nFrom: ${name} <${email}>\n\n${message}\n\nReply to this email or open the dashboard inbox at /dashboard.`,
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

    return { id, emailed, emailError };
  },
});