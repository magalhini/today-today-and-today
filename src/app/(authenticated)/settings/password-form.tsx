"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/account-actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5 max-w-sm">
      {state?.error && (
        <div role="alert" className="text-error text-sm font-[family-name:var(--font-body)]">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
          Current Password
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal focus:border-terracotta transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
          New Password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal focus:border-terracotta transition-colors"
          placeholder="At least 8 characters"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="py-2.5 px-6 bg-charcoal text-cream text-xs uppercase tracking-[0.15em] hover:bg-charcoal-light disabled:opacity-40 transition-colors"
      >
        {pending ? "Changing..." : "Change password"}
      </button>
    </form>
  );
}
