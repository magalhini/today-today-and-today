"use server";

import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, destroySession, hashPassword, verifyPassword } from "./auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string } | undefined;

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const displayName = formData.get("displayName") as string;
  const location = formData.get("location") as string;

  if (!displayName?.trim()) {
    return { error: "Display name is required." };
  }

  db.update(users)
    .set({
      displayName: displayName.trim(),
      location: location?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, session.user.id))
    .run();

  revalidatePath("/settings");
  return undefined;
}

export async function changePasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "Both fields are required." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  if (!verifyPassword(currentPassword, session.user.passwordHash)) {
    return { error: "Current password is incorrect." };
  }

  db.update(users)
    .set({
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, session.user.id))
    .run();

  return undefined;
}

export async function deleteAccountAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  // Delete user — cascading deletes handle posts, acks, invite codes, sessions
  db.delete(users).where(eq(users.id, session.user.id)).run();
  await destroySession();
  redirect("/login");
}
