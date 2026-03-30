import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Editor } from "./editor";

export default async function WritePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Check if user has an in-progress draft for today, otherwise create a new one
  let post = db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.authorId, session.user.id),
        eq(posts.draftStartedAt, today),
        eq(posts.status, "draft")
      )
    )
    .get();

  if (!post) {
    // Check daily limit (5 posts per day)
    const todayCount = db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.authorId, session.user.id),
          eq(posts.draftStartedAt, today)
        )
      )
      .all().length;

    if (todayCount >= 5) {
      redirect("/");
    }

    post = db
      .insert(posts)
      .values({
        authorId: session.user.id,
        draftStartedAt: today,
      })
      .returning()
      .get();
  }

  const dateLabel = new Date(post.draftStartedAt + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <Editor
      postId={post.id}
      initialTitle={post.title}
      initialBody={post.body}
      initialCoverImage={post.coverImagePath}
      initialLocation={post.locationName}
      dateLabel={dateLabel}
      status={post.status}
    />
  );
}
