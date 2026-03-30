import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { users, posts, inviteCodes } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AdminUserRow } from "./admin-user-row";
import { AdminPostRow } from "./admin-post-row";
import { AdminInviteCodes } from "./admin-invite-codes";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") notFound();

  // Get all users with post counts
  const allUsers = db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      inviteCodesRemaining: users.inviteCodesRemaining,
      createdAt: users.createdAt,
      postCount: sql<number>`(SELECT count(*) FROM posts WHERE posts.author_id = ${users.id})`,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .all();

  // Get all posts with author info
  const allPosts = db
    .select({
      id: posts.id,
      title: posts.title,
      status: posts.status,
      draftStartedAt: posts.draftStartedAt,
      publishedAt: posts.publishedAt,
      authorName: sql<string>`(SELECT display_name FROM users WHERE users.id = ${posts.authorId})`,
      authorUsername: sql<string>`(SELECT username FROM users WHERE users.id = ${posts.authorId})`,
    })
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .all();

  // Get all invite codes
  const allCodes = db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      createdByName: sql<string>`(SELECT display_name FROM users WHERE users.id = ${inviteCodes.createdBy})`,
      usedByName: sql<string | null>`(SELECT display_name FROM users WHERE users.id = ${inviteCodes.usedBy})`,
      usedAt: inviteCodes.usedAt,
      expiresAt: inviteCodes.expiresAt,
      createdAt: inviteCodes.createdAt,
    })
    .from(inviteCodes)
    .orderBy(desc(inviteCodes.createdAt))
    .all();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-[1.1] mb-12">
        Admin
      </h1>

      {/* Users */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-6">
          Users ({allUsers.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-muted border-b border-charcoal-muted/15">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Posts</th>
                <th className="py-3 pr-4">Invites</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <AdminUserRow
                  key={u.id}
                  user={{
                    id: u.id,
                    displayName: u.displayName,
                    username: u.username,
                    email: u.email,
                    role: u.role,
                    postCount: u.postCount,
                    inviteCodesRemaining: u.inviteCodesRemaining,
                    createdAt: u.createdAt,
                  }}
                  isCurrentUser={u.id === session.user.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Posts */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-6">
          Posts ({allPosts.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-charcoal-muted border-b border-charcoal-muted/15">
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Author</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allPosts.map((p) => (
                <AdminPostRow
                  key={p.id}
                  post={{
                    id: p.id,
                    title: p.title,
                    status: p.status,
                    draftStartedAt: p.draftStartedAt,
                    authorName: p.authorName,
                    authorUsername: p.authorUsername,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite codes */}
      <section>
        <h2 className="text-2xl font-semibold text-charcoal mb-6">
          Invite Codes ({allCodes.length})
        </h2>
        <AdminInviteCodes codes={allCodes} />
      </section>
    </div>
  );
}
