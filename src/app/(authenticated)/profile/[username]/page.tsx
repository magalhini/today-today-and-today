import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

const PAGE_SIZE = 9;

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { username } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  const author = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!author) notFound();

  const isOwnProfile = session.user.id === author.id;

  const whereClause = isOwnProfile
    ? eq(posts.authorId, author.id)
    : and(eq(posts.authorId, author.id), eq(posts.status, "published"));

  const allPosts = db
    .select()
    .from(posts)
    .where(whereClause)
    .orderBy(desc(posts.draftStartedAt))
    .all();

  const totalPages = Math.max(1, Math.ceil(allPosts.length / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;
  const pagePosts = allPosts.slice(offset, offset + PAGE_SIZE);

  const memberSince = new Date(author.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Profile header */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-[1.1] mb-3">
          {author.displayName}
        </h1>
        <div className="flex items-center gap-3 text-sm text-charcoal-muted">
          <span>@{author.username}</span>
          <span className="text-charcoal-muted/30">·</span>
          <span>Member since {memberSince}</span>
          {author.location && (
            <>
              <span className="text-charcoal-muted/30">·</span>
              <span>{author.location}</span>
            </>
          )}
        </div>
        <p className="text-sm text-charcoal-muted/60 mt-2">
          {allPosts.length} {allPosts.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {/* Posts grid */}
      {pagePosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {pagePosts.map((post) => {
              const preview = post.body
                .replace(/<[^>]*>/g, "")
                .slice(0, 140);
              const postDate = new Date(
                post.draftStartedAt + "T12:00:00"
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <Link
                  key={post.id}
                  href={
                    post.status === "draft"
                      ? `/write/${post.id}`
                      : `/post/${post.id}`
                  }
                  className="block group"
                >
                  <article className="h-full flex flex-col">
                    <div className="relative w-full aspect-[3/2] overflow-hidden rounded-sm mb-4">
                      {post.coverImagePath ? (
                        <>
                          <Image
                            src={post.coverImagePath}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3
                              className="text-lg md:text-xl font-[family-name:var(--font-serif)] font-semibold text-white leading-tight"
                              style={{
                                textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                              }}
                            >
                              {post.title || "Untitled"}
                            </h3>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-cream-dark flex items-end p-4 group-hover:bg-charcoal-muted/10 transition-colors">
                          <h3 className="text-lg md:text-xl font-[family-name:var(--font-serif)] font-semibold text-charcoal group-hover:text-terracotta transition-colors leading-tight">
                            {post.title || "Untitled"}
                          </h3>
                        </div>
                      )}
                      {post.status === "draft" && (
                        <span className="absolute top-3 left-3 text-xs uppercase tracking-wider text-terracotta bg-cream/90 border border-terracotta/30 px-2 py-0.5">
                          Draft
                        </span>
                      )}
                    </div>

                    <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
                      {preview}
                      {preview.length >= 140 ? "..." : ""}
                    </p>

                    <div className="text-xs text-charcoal-muted/50">
                      {postDate}
                      {post.locationName && (
                        <span> · {post.locationName}</span>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-16 flex items-center justify-center gap-4"
              aria-label="Pagination"
            >
              {page > 1 && (
                <Link
                  href={`/profile/${username}?page=${page - 1}`}
                  className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-xs text-charcoal-muted/50 tabular-nums">
                {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/profile/${username}?page=${page + 1}`}
                  className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
                >
                  Next &rarr;
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <p className="font-[family-name:var(--font-body)] text-charcoal-muted italic text-center py-16">
          No entries yet.
        </p>
      )}
    </div>
  );
}
