"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "./auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

type ActionResult = { error: string } | undefined;

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

function countWords(text: string): number {
  // Strip HTML tags for word counting
  const stripped = text.replace(/<[^>]*>/g, " ");
  const words = stripped
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.length;
}

export async function createDraftAction(): Promise<
  { error: string } | { postId: number }
> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const today = getTodayDateString();

  // Check daily limit (5 posts per day)
  const todayPosts = db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.authorId, session.user.id),
        eq(posts.draftStartedAt, today)
      )
    )
    .all();

  if (todayPosts.length >= 5) {
    return { error: "You've reached the daily limit of 5 entries." };
  }

  const post = db
    .insert(posts)
    .values({
      authorId: session.user.id,
      draftStartedAt: today,
    })
    .returning()
    .get();

  return { postId: post.id };
}

export async function saveDraftAction(
  postId: number,
  title: string,
  body: string
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return { error: "Post not found." };
  if (post.authorId !== session.user.id) return { error: "Not your post." };

  const wordCount = countWords(body);
  if (wordCount > 1000) {
    return { error: "Post exceeds 1,000 word limit." };
  }

  db.update(posts)
    .set({
      title,
      body,
      wordCount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, postId))
    .run();

  return undefined;
}

export async function publishPostAction(postId: number): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return { error: "Post not found." };
  if (post.authorId !== session.user.id) return { error: "Not your post." };

  const wordCount = countWords(post.body);
  if (wordCount > 1000) {
    return { error: "Post exceeds 1,000 word limit." };
  }

  if (!post.title.trim()) {
    return { error: "A title is needed before publishing." };
  }

  if (!post.body.trim()) {
    return { error: "Write something before publishing." };
  }

  db.update(posts)
    .set({
      status: "published",
      publishedAt: new Date().toISOString(),
      wordCount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, postId))
    .run();

  revalidatePath("/");
  redirect(`/post/${postId}`);
}

export async function unpublishPostAction(
  postId: number
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return { error: "Post not found." };
  if (post.authorId !== session.user.id) return { error: "Not your post." };

  db.update(posts)
    .set({
      status: "draft",
      publishedAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, postId))
    .run();

  revalidatePath("/");
  return undefined;
}

export async function updateCoverImageAction(
  postId: number,
  imagePath: string | null
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) return { error: "Post not found." };
  if (post.authorId !== session.user.id) return { error: "Not your post." };

  // If replacing, clean up old image
  if (post.coverImagePath && imagePath !== post.coverImagePath) {
    cleanupImage(post.coverImagePath);
  }

  db.update(posts)
    .set({
      coverImagePath: imagePath,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, postId))
    .run();

  return undefined;
}

function cleanupImage(imagePath: string) {
  try {
    // Extract filename from API path like /api/uploads/abc.webp
    const filename = path.basename(imagePath);
    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch {
    // Silently ignore cleanup failures
  }
}

export async function deletePostAction(postId: number): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const post = db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post || post.authorId !== session.user.id) redirect("/");

  // Clean up cover image
  if (post.coverImagePath) {
    cleanupImage(post.coverImagePath);
  }

  db.delete(posts).where(eq(posts.id, postId)).run();
  revalidatePath("/");
  redirect("/");
}
