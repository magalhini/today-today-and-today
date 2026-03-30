"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import Link from "next/link";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-charcoal leading-tight mb-3">
            Today, Today
            <br />
            <span className="italic font-light">and Today</span>
          </h1>
          <p className="text-charcoal-muted font-[family-name:var(--font-body)] text-sm mt-4">
            Welcome back to your daily practice.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div
              role="alert"
              className="text-error text-sm text-center font-[family-name:var(--font-body)]"
            >
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal placeholder:text-charcoal-muted/50 focus:border-terracotta focus:outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal placeholder:text-charcoal-muted/50 focus:border-terracotta focus:outline-none transition-colors"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full mt-8 py-3 bg-charcoal text-cream text-sm uppercase tracking-wider hover:bg-charcoal-light disabled:opacity-50 transition-colors"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-charcoal-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-terracotta hover:text-terracotta-light underline underline-offset-4">
            Join with an invite
          </Link>
        </p>
      </div>
    </main>
  );
}
