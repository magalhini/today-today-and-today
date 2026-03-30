"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/lib/account-actions";

export function DeleteAccount() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAccountAction();
    });
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs uppercase tracking-wider text-charcoal-muted/50 hover:text-error transition-colors"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="p-4 border border-error/20 bg-error/5">
      <p className="text-sm text-charcoal mb-4 font-[family-name:var(--font-body)]">
        Are you sure? This will permanently delete your account and all your
        posts. This cannot be undone.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="py-2 px-5 bg-error text-white text-xs uppercase tracking-wider hover:bg-error/80 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Deleting..." : "Yes, delete everything"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-charcoal transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
