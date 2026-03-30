"use server";

import { db } from "@/db";
import { users, posts, inviteCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

type ActionResult = { error: string } | undefined;

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function grantInviteCodesAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized." };

  const userId = parseInt(formData.get("userId") as string, 10);
  const count = parseInt(formData.get("count") as string, 10);

  if (isNaN(userId) || isNaN(count) || count < 1) {
    return { error: "Invalid input." };
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return { error: "User not found." };

  db.update(users)
    .set({ inviteCodesRemaining: user.inviteCodesRemaining + count })
    .where(eq(users.id, userId))
    .run();

  revalidatePath("/admin");
  return undefined;
}

export async function adminDeleteUserAction(userId: number): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized." };

  if (userId === session.user.id) {
    return { error: "Cannot delete your own admin account from here." };
  }

  db.delete(users).where(eq(users.id, userId)).run();
  revalidatePath("/admin");
  return undefined;
}

export async function adminDeletePostAction(postId: number): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized." };

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return { error: "Post not found." };

  // Clean up cover image
  if (post.coverImagePath) {
    try {
      const filename = path.basename(post.coverImagePath);
      const uploadDir = process.env.UPLOAD_DIR || "./uploads";
      const filepath = path.join(uploadDir, filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch {
      // Ignore
    }
  }

  db.delete(posts).where(eq(posts.id, postId)).run();
  revalidatePath("/admin");
  return undefined;
}
