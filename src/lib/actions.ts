"use server";

import { db } from "@/db";
import { users, inviteCodes } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  getSession,
} from "./auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

type ActionResult = { error: string } | undefined;

export async function registerAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;
  const password = formData.get("password") as string;
  const inviteCode = formData.get("inviteCode") as string;

  if (!email || !username || !displayName || !password || !inviteCode) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      error:
        "Username can only contain letters, numbers, hyphens, and underscores.",
    };
  }

  // Validate invite code
  const invite = db
    .select()
    .from(inviteCodes)
    .where(and(eq(inviteCodes.code, inviteCode.trim()), isNull(inviteCodes.usedBy)))
    .get();

  if (!invite) {
    return { error: "Invalid or already used invite code." };
  }

  if (new Date(invite.expiresAt) < new Date()) {
    return { error: "This invite code has expired." };
  }

  const existingEmail = db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();
  if (existingEmail) {
    return { error: "An account with this email already exists." };
  }

  const existingUsername = db
    .select()
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .get();
  if (existingUsername) {
    return { error: "This username is already taken." };
  }

  const passwordHash = hashPassword(password);
  const newUser = db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
    })
    .returning()
    .get();

  // Consume the invite code
  db.update(inviteCodes)
    .set({ usedBy: newUser.id, usedAt: new Date().toISOString() })
    .where(eq(inviteCodes.id, invite.id))
    .run();

  await createSession(newUser.id);
  redirect("/");
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function generateInviteCodeAction(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const { user } = session;

  if (user.inviteCodesRemaining <= 0) {
    return { error: "You have no invite codes remaining." };
  }

  const code = crypto.randomBytes(6).toString("hex"); // 12-char hex code
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  db.insert(inviteCodes)
    .values({
      code,
      createdBy: user.id,
      expiresAt,
    })
    .run();

  db.update(users)
    .set({ inviteCodesRemaining: user.inviteCodesRemaining - 1 })
    .where(eq(users.id, user.id))
    .run();

  return undefined;
}
