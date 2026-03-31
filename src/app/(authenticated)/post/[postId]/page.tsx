import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { posts, users, atmosphericDetails, acknowledgments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import { getAcknowledgments } from "@/lib/acknowledgment-actions";
import { ISeeYou } from "./i-see-you";

export default async function PostPage({
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

  // Only show published posts to others, drafts only to the author
  if (post.status === "draft" && post.authorId !== session.user.id) {
    notFound();
  }

  const author = db
    .select()
    .from(users)
    .where(eq(users.id, post.authorId))
    .get();
  if (!author) notFound();

  const isOwner = session.user.id === post.authorId;

  const atmosphere = db
    .select()
    .from(atmosphericDetails)
    .where(eq(atmosphericDetails.postId, id))
    .all();

  // Acknowledgments
  const acks = await getAcknowledgments(id);
  const userAcked = acks.some((a) => a.userId === session.user.id);

  const postDate = new Date(
    post.draftStartedAt + "T12:00:00"
  ).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      {/* Cover image with title overlay */}
      {post.coverImagePath ? (
        <div className="relative w-full aspect-[2/1] max-h-[480px] overflow-hidden mb-12">
          <Image
            src={post.coverImagePath}
            alt={post.title || "Cover image"}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Title over image */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-3">
              {postDate}
              {post.locationName && (
                <span> &middot; {post.locationName}</span>
              )}
            </p>
            {post.status === "draft" && (
              <span className="inline-block text-xs uppercase tracking-wider text-terracotta-light border border-terracotta-light/40 px-2 py-0.5 mb-3">
                Draft
              </span>
            )}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] font-semibold text-white leading-[1.12]"
              style={{
                textShadow: "0 2px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {post.title || "Untitled"}
            </h1>
            {atmosphere.length > 0 && (
              <p
                className="font-[family-name:var(--font-serif)] italic text-white/70 text-sm md:text-base mt-3"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
              >
                {atmosphere.map((a, i) => (
                  <span key={a.id}>
                    {i > 0 && <span className="opacity-50"> · </span>}
                    {a.displayText}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-12 md:pt-20 mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal-muted/60 mb-6">
            {postDate}
            {post.locationName && (
              <span> &middot; {post.locationName}</span>
            )}
          </p>
          {post.status === "draft" && (
            <span className="inline-block text-xs uppercase tracking-wider text-terracotta border border-terracotta/30 px-2 py-0.5 mb-4">
              Draft
            </span>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-serif)] font-semibold text-charcoal leading-[1.12]">
            {post.title || "Untitled"}
          </h1>
          {atmosphere.length > 0 && (
            <p className="font-[family-name:var(--font-serif)] italic text-charcoal-muted text-base md:text-lg mt-4">
              {atmosphere.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && <span className="text-charcoal-muted/50"> · </span>}
                  {a.displayText}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12 md:pb-20">

      {/* Body */}
      <div
        className="post-body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
      />

      {/* I see you */}
      {post.status === "published" && (
        <div className="mt-12 mb-12">
          <ISeeYou
            postId={post.id}
            initialAcknowledged={userAcked}
            initialCount={acks.length}
            acknowledgers={acks.map((a) => ({
              displayName: a.displayName,
              username: a.username,
            }))}
            isOwner={isOwner}
            isAuthenticated={true}
          />
        </div>
      )}

      {/* Author line */}
      <footer className="pt-8 border-t border-charcoal-muted/10">
        <div className="flex items-center justify-between">
          <Link href={`/profile/${author.username}`} className="group/author">
            <p className="text-sm text-charcoal font-medium group-hover/author:text-terracotta transition-colors">
              {author.displayName}
            </p>
            <p className="text-xs text-charcoal-muted mt-0.5">
              @{author.username}
            </p>
          </Link>

          {isOwner && (
            <Link
              href={`/write/${post.id}`}
              className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </footer>
      </div>
    </article>
  );
}
