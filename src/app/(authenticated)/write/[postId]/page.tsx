import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Editor } from "../editor";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { postId } = await params;
  const id = parseInt(postId, 10);
  if (isNaN(id)) notFound();

  const post = db.select().from(posts).where(eq(posts.id, id)).get();
  if (!post) notFound();
  if (post.authorId !== session.user.id) notFound();

  const dateLabel = new Date(
    post.draftStartedAt + "T12:00:00"
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
