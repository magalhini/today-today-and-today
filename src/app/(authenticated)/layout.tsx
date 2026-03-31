import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserDropdown } from "./user-dropdown";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-charcoal-muted/10">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-serif)] text-xl font-semibold text-charcoal hover:text-terracotta transition-colors"
          >
            Today, Today <span className="italic font-light">& Today</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/write"
              className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
            >
              Write
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs uppercase tracking-wider text-charcoal-muted/50 hover:text-terracotta transition-colors hidden sm:inline"
              >
                Admin
              </Link>
            )}
            <UserDropdown username={user.username} />
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

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
