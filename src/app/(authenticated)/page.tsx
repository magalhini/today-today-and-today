import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { posts, users, acknowledgments } from "@/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";

const PAGE_SIZE = 9;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; author?: string; location?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const authorFilter = params.author || "";
  const locationFilter = params.location || "";

  // Build where conditions
  const conditions = [eq(posts.status, "published" as const)];

  if (authorFilter) {
    conditions.push(eq(users.username, authorFilter));
  }

  if (locationFilter) {
    conditions.push(like(posts.locationName, `%${locationFilter}%`));
  }

  const whereClause = and(...conditions);

  // Get total count for pagination
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(whereClause)
    .get();

  const totalPosts = countResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  const feedPosts = db
    .select({
      id: posts.id,
      title: posts.title,
      body: posts.body,
      coverImagePath: posts.coverImagePath,
      draftStartedAt: posts.draftStartedAt,
      locationName: posts.locationName,
      authorName: users.displayName,
      authorUsername: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(whereClause)
    .orderBy(desc(posts.publishedAt))
    .limit(PAGE_SIZE)
    .offset(offset)
    .all();

  // Get ack counts for the displayed posts
  const postIds = feedPosts.map((p) => p.id);
  const ackCounts: Record<number, number> = {};
  if (postIds.length > 0) {
    const acks = db
      .select({
        postId: acknowledgments.postId,
        count: sql<number>`count(*)`,
      })
      .from(acknowledgments)
      .where(
        sql`${acknowledgments.postId} IN (${sql.join(
          postIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .groupBy(acknowledgments.postId)
      .all();
    for (const a of acks) {
      ackCounts[a.postId] = a.count;
    }
  }

  // Get unique locations and authors for filter hints
  const allLocations = db
    .selectDistinct({ locationName: posts.locationName })
    .from(posts)
    .where(eq(posts.status, "published"))
    .all()
    .map((r) => r.locationName)
    .filter(Boolean) as string[];

  const allAuthors = db
    .selectDistinct({
      username: users.username,
      displayName: users.displayName,
    })
    .from(users)
    .innerJoin(posts, eq(posts.authorId, users.id))
    .where(eq(posts.status, "published"))
    .all();

  const hasFilters = authorFilter || locationFilter;

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      page: params.page,
      author: params.author,
      location: params.location,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "1") p.set(k, v);
      else if (k === "page" && v === "1") {
        /* omit page=1 */
      }
    }
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-charcoal leading-[1.1] mb-6">
          Good{" "}
          <span className="italic font-light">{getTimeOfDay()}</span>,
          <br />
          {user.displayName.split(" ")[0]}
        </h1>

        <div className="mt-8">
          <Link
            href="/write"
            className="inline-block py-3.5 px-10 bg-charcoal text-cream text-sm uppercase tracking-[0.15em] hover:bg-charcoal-light transition-colors"
          >
            Write today&apos;s entry
          </Link>
        </div>
      </div>

      {/* Filters */}
      {(feedPosts.length > 0 || hasFilters) && (
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-charcoal-muted/15" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-charcoal-muted/60">
              {hasFilters ? "Filtered entries" : "Recent entries"}
            </h2>
            <div className="flex-1 h-px bg-charcoal-muted/15" />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Author filter pills */}
            {allAuthors.map((a) => (
              <Link
                key={a.username}
                href={buildUrl({
                  author: authorFilter === a.username ? undefined : a.username,
                  page: "1",
                })}
                className={`px-3 py-1.5 border transition-colors ${
                  authorFilter === a.username
                    ? "border-terracotta text-terracotta bg-terracotta/5"
                    : "border-charcoal-muted/15 text-charcoal-muted hover:border-charcoal-muted/40"
                }`}
              >
                {a.displayName}
              </Link>
            ))}

            {/* Location filter pills */}
            {allLocations.map((loc) => (
              <Link
                key={loc}
                href={buildUrl({
                  location: locationFilter === loc ? undefined : loc,
                  page: "1",
                })}
                className={`px-3 py-1.5 border transition-colors ${
                  locationFilter === loc
                    ? "border-sage text-sage bg-sage/5"
                    : "border-charcoal-muted/15 text-charcoal-muted hover:border-charcoal-muted/40"
                }`}
              >
                {loc}
              </Link>
            ))}

            {hasFilters && (
              <Link
                href="/"
                className="px-3 py-1.5 text-charcoal-muted/50 hover:text-charcoal-muted transition-colors"
              >
                Clear filters
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Post grid */}
      {feedPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {feedPosts.map((post) => {
              const preview = post.body
                .replace(/<[^>]*>/g, "")
                .slice(0, 140);
              const postDate = new Date(
                post.draftStartedAt + "T12:00:00"
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="block group"
                >
                  <article className="h-full flex flex-col">
                    {/* Card image or warm fallback */}
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
                                textShadow:
                                  "0 1px 8px rgba(0,0,0,0.4)",
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

                    {/* Preview text */}
                    <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-sm leading-relaxed line-clamp-2 mb-3 flex-1">
                      {preview}
                      {preview.length >= 140 ? "..." : ""}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-charcoal-muted/50">
                      <span>
                        {post.authorName}
                        {(ackCounts[post.id] ?? 0) > 0 && (
                          <span className="ml-2 text-charcoal-muted/35">
                            · {ackCounts[post.id]} 👁
                          </span>
                        )}
                      </span>
                      <span>
                        {postDate}
                        {post.locationName && (
                          <span> · {post.locationName}</span>
                        )}
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="mt-16 flex items-center justify-center gap-4"
              aria-label="Pagination"
            >
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
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
                  href={buildUrl({ page: String(page + 1) })}
                  className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
                >
                  Next &rarr;
                </Link>
              )}
            </nav>
          )}
        </>
      ) : hasFilters ? (
        <div className="text-center py-16">
          <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-base italic">
            No entries match these filters.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-xs uppercase tracking-wider text-terracotta hover:text-terracotta-light transition-colors"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-px h-12 bg-charcoal-muted/20" />
            <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-base leading-relaxed max-w-sm">
              The feed is quiet for now. Soon this space will fill with
              the daily musings of fellow writers.
            </p>
            <div className="w-px h-12 bg-charcoal-muted/20" />
            <p className="text-xs uppercase tracking-[0.2em] text-charcoal-muted/60">
              {formatDate(new Date())}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
