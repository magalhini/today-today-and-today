"use server";

import { db } from "@/db";
import { acknowledgments, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function toggleAcknowledgmentAction(
  postId: number
): Promise<{ acknowledged: boolean; count: number } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };

  const userId = session.user.id;

  const existing = db
    .select()
    .from(acknowledgments)
    .where(
      and(
        eq(acknowledgments.postId, postId),
        eq(acknowledgments.userId, userId)
      )
    )
    .get();

  if (existing) {
    // Remove acknowledgment
    db.delete(acknowledgments)
      .where(eq(acknowledgments.id, existing.id))
      .run();
  } else {
    // Add acknowledgment
    db.insert(acknowledgments)
      .values({ postId, userId })
      .run();
  }

  // Get updated count
  const allAcks = db
    .select()
    .from(acknowledgments)
    .where(eq(acknowledgments.postId, postId))
    .all();

  revalidatePath(`/post/${postId}`);

  return {
    acknowledged: !existing,
    count: allAcks.length,
  };
}

export async function getAcknowledgments(postId: number) {
  const acks = db
    .select({
      id: acknowledgments.id,
      userId: acknowledgments.userId,
      displayName: users.displayName,
      username: users.username,
      createdAt: acknowledgments.createdAt,
    })
    .from(acknowledgments)
    .innerJoin(users, eq(acknowledgments.userId, users.id))
    .where(eq(acknowledgments.postId, postId))
    .orderBy(acknowledgments.createdAt)
    .all();

  return acks;
}
