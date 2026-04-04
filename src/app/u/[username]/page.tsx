import { notFound } from "next/navigation";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const author = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!author) return { title: "Not Found" };

  return {
    title: `${author.displayName} (@${author.username}) — Today, Today and Today`,
    description:
      author.bio || `${author.displayName}'s profile on Today, Today and Today.`,
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  const author = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!author) notFound();

  const allPosts = db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, author.id), eq(posts.status, "published")))
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
    <div className="min-h-full flex flex-col">
      <header className="border-b border-charcoal-muted/10">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/about"
            className="font-[family-name:var(--font-serif)] text-xl font-semibold text-charcoal hover:text-terracotta transition-colors"
          >
            Today, Today <span className="italic font-light">& Today</span>
          </Link>
          <Link
            href="/login"
            className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          {/* Profile header */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-[1.1] mb-3">
              {author.displayName}
            </h1>
            <div className="flex items-center gap-3 text-sm text-charcoal-muted">
              <span>@{author.username}</span>
              <span className="text-charcoal-muted/50">·</span>
              <span>Member since {memberSince}</span>
              {author.location && (
                <>
                  <span className="text-charcoal-muted/50">·</span>
                  <span>{author.location}</span>
                </>
              )}
            </div>
            {author.bio && (
              <p className="font-[family-name:var(--font-body)] text-charcoal-light text-sm leading-relaxed mt-4 max-w-xl">
                {author.bio}
              </p>
            )}
            <p className="text-sm text-charcoal-muted/60 mt-2">
              {allPosts.length}{" "}
              {allPosts.length === 1 ? "entry" : "entries"}
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
                      href={`/post/${post.id}`}
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
                      href={`/u/${username}?page=${page - 1}`}
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
                      href={`/u/${username}?page=${page + 1}`}
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
      </main>

      <footer className="border-t border-charcoal-muted/10 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <Link
            href="/about"
            className="text-xs text-charcoal-muted/50 font-[family-name:var(--font-body)] italic hover:text-terracotta transition-colors"
          >
            About Today, Today and Today
          </Link>
        </div>
      </footer>
    </div>
  );
}
