import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { type QueryCtx } from "./_generated/server";

/**
 * Shared owner-guard helpers for the owner CMS.
 *
 * The ONLY account allowed to read/modify site content & contact messages is the
 * one whose email matches OWNER_EMAIL (a Convex env var, falling back to the
 * portfolio email). Anonymous/guest accounts are always rejected.
 */

const OWNER_EMAIL = (
  process.env.OWNER_EMAIL ?? "shedgesahil2005@gmail.com"
).toLowerCase();

export const OWNER_EMAIL_VALIDATOR = v.string();

export function ownerEmail(): string {
  return OWNER_EMAIL;
}

export type OwnerUser = { email?: string; isAnonymous?: boolean };

/** Load the signed-in user record, or null when signed out. */
export async function getCurrentUser(
  ctx: QueryCtx,
): Promise<OwnerUser | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return { email: user.email ?? undefined, isAnonymous: user.isAnonymous };
}

export function isOwner(user: OwnerUser | null): boolean {
  return (
    !!user &&
    user.isAnonymous !== true &&
    !!user.email &&
    user.email.toLowerCase() === OWNER_EMAIL
  );
}

/** Throw unless the caller is the portfolio owner. */
export async function requireOwner(ctx: QueryCtx): Promise<OwnerUser> {
  const user = await getCurrentUser(ctx);
  if (!isOwner(user)) {
    throw new Error(
      "Not authorized. Sign in with the owner account (email OTP, no guest sign-in).",
    );
  }
  return user!;
}
