import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { PostActions } from "./post-actions";

export default async function YourPostsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userPosts = db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      wordCount: posts.wordCount,
      draftStartedAt: posts.draftStartedAt,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.authorId, session.user.id))
    .orderBy(desc(posts.createdAt))
    .all();

  const published = userPosts.filter((p) => p.status === "published");
  const drafts = userPosts.filter((p) => p.status === "draft");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-[1.1] mb-12">
        Your Posts
      </h1>

      {userPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-base italic mb-6">
            You haven&#8217;t written anything yet.
          </p>
          <Link
            href="/write"
            className="inline-block py-3 px-8 bg-charcoal text-cream text-sm uppercase tracking-[0.15em] hover:bg-charcoal-light transition-colors"
          >
            Write your first entry
          </Link>
        </div>
      ) : (
        <>
          {published.length > 0 && (
            <section className="mb-12">
              <h2 className="text-s tracking-[0.2em] text-charcoal-muted/60 mb-6">
                Published ({published.length})
              </h2>
              <div className="space-y-0 divide-y divide-charcoal-muted/10">
                {published.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-4 gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/post/${post.id}`}
                        className="font-[family-name:var(--font-serif)] text-charcoal hover:text-terracotta transition-colors font-medium truncate block"
                      >
                        {post.title || "Untitled"}
                      </Link>
                      <p className="text-xs text-charcoal-muted/50 mt-1">
                        {formatDate(post.publishedAt || post.draftStartedAt)}
                        {post.wordCount > 0 && (
                          <span> &middot; {post.wordCount} words</span>
                        )}
                      </p>
                    </div>
                    <PostActions postId={post.id} status="published" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {drafts.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.2em] text-charcoal-muted/60 mb-6">
                Drafts ({drafts.length})
              </h2>
              <div className="space-y-0 divide-y divide-charcoal-muted/10">
                {drafts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-4 gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/write/${post.id}`}
                        className="font-[family-name:var(--font-serif)] text-charcoal hover:text-terracotta transition-colors font-medium truncate block"
                      >
                        {post.title || "Untitled"}
                      </Link>
                      <p className="text-xs text-charcoal-muted/50 mt-1">
                        Started {formatDate(post.draftStartedAt)}
                        {post.wordCount > 0 && (
                          <span> &middot; {post.wordCount} words</span>
                        )}
                      </p>
                    </div>
                    <PostActions postId={post.id} status="draft" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(
    dateStr.includes("T") ? dateStr : dateStr + "T12:00:00",
  );
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
