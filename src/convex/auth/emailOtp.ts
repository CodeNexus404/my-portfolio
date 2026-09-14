import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Dashboard owner login via email OTP. The token is generated locally (a random
 * 6-digit code); delivery goes through YOUR OWN Resend integration, reusing the
 * same RESEND_API_KEY / RESEND_FROM env vars the reply feature uses — so login
 * OTPs arrive from your verified domain, not a third party.
 *
 * Requirements: set RESEND_API_KEY (and ideally RESEND_FROM to a verified domain)
 * in your Convex deployment env. Without RESEND_API_KEY the OTP can't be emailed
 * and sign-in will surface an error.
 */
export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured — cannot send the login code. Set it in your Convex deployment env.",
      );
    }
    const from = process.env.RESEND_FROM ?? "Sahil Shedge <onboarding@resend.dev>";
    const appName = process.env.VLY_APP_NAME || "Portfolio Dashboard";
    try {
      await axios.post(
        "https://api.resend.com/emails",
        {
          from,
          to: [email],
          subject: `Your ${appName} login code`,
          text: `Your login code is ${token}. It expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.`,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      throw new Error(
        `Failed to send login code via Resend: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }
  },
});
