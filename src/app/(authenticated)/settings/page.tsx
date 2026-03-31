import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { inviteCodes, users as usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { InviteCodeList } from "./invite-codes";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DeleteAccount } from "./delete-account";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;

  const codes = db
    .select({
      id: inviteCodes.id,
      code: inviteCodes.code,
      usedBy: inviteCodes.usedBy,
      usedAt: inviteCodes.usedAt,
      expiresAt: inviteCodes.expiresAt,
      createdAt: inviteCodes.createdAt,
      usedByName: usersTable.displayName,
    })
    .from(inviteCodes)
    .leftJoin(usersTable, eq(inviteCodes.usedBy, usersTable.id))
    .where(eq(inviteCodes.createdBy, user.id))
    .orderBy(inviteCodes.createdAt)
    .all();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-[1.1] mb-12">
        Settings
      </h1>

      {/* Profile */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-6">
          Profile
        </h2>
        <ProfileForm
          displayName={user.displayName}
          location={user.location || ""}
          username={user.username}
          email={user.email}
        />
      </section>

      {/* Invite codes */}
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-semibold text-charcoal">
            Invite Codes
          </h2>
          <span className="text-sm text-charcoal-muted">
            {user.inviteCodesRemaining} remaining
          </span>
        </div>

        <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-sm leading-relaxed mb-8">
          Share an invite code with someone you&#8217;d like to write alongside.
          Each code can be used once and expires after 30 days.
        </p>

        <InviteCodeList
          codes={codes.map((c) => ({
            id: c.id,
            code: c.code,
            usedByName: c.usedByName,
            usedAt: c.usedAt,
            expiresAt: c.expiresAt,
            createdAt: c.createdAt,
          }))}
          canGenerate={user.inviteCodesRemaining > 0}
        />
      </section>

      {/* Change password */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-6">
          Change Password
        </h2>
        <PasswordForm />
      </section>

      {/* Delete account */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-charcoal mb-4">
          Delete Account
        </h2>
        <p className="font-[family-name:var(--font-body)] text-charcoal-muted text-sm leading-relaxed mb-6">
          This will permanently delete your account, all your posts, and all
          your data. This cannot be undone.
        </p>
        <DeleteAccount />
      </section>
    </div>
  );
}
