"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/account-actions";

export function ProfileForm({
  displayName,
  location,
  username,
  email,
}: {
  displayName: string;
  location: string;
  username: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div role="alert" className="text-error text-sm font-[family-name:var(--font-body)]">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
            Display Name
          </label>
          <input
            name="displayName"
            type="text"
            defaultValue={displayName}
            required
            className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal focus:border-terracotta transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
            Location
          </label>
          <input
            name="location"
            type="text"
            defaultValue={location}
            placeholder="Where you write from"
            className="w-full border-b border-charcoal-muted/30 bg-transparent py-2 text-charcoal placeholder:text-charcoal-muted/40 focus:border-terracotta transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
            Username
          </label>
          <p className="py-2 text-charcoal-muted/60 text-sm">@{username}</p>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal-muted mb-2">
            Email
          </label>
          <p className="py-2 text-charcoal-muted/60 text-sm">{email}</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="py-2.5 px-6 bg-charcoal text-cream text-xs uppercase tracking-[0.15em] hover:bg-charcoal-light disabled:opacity-40 transition-colors"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>

      {state === undefined && !pending && (
        <span className="ml-3 text-xs text-sage">Saved</span>
      )}
    </form>
  );
}
