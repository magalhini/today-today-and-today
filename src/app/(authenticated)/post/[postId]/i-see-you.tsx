"use client";

import { useState, useTransition } from "react";
import { toggleAcknowledgmentAction } from "@/lib/acknowledgment-actions";

type Acknowledger = {
  displayName: string;
  username: string;
};

export function ISeeYou({
  postId,
  initialAcknowledged,
  initialCount,
  acknowledgers,
  isOwner,
  isAuthenticated,
}: {
  postId: number;
  initialAcknowledged: boolean;
  initialCount: number;
  acknowledgers: Acknowledger[];
  isOwner: boolean;
  isAuthenticated: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [count, setCount] = useState(initialCount);
  const [showWho, setShowWho] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated || isOwner) return;

    // Optimistic update
    const newState = !acknowledged;
    setAcknowledged(newState);
    setCount((c) => c + (newState ? 1 : -1));

    startTransition(async () => {
      const result = await toggleAcknowledgmentAction(postId);
      if ("error" in result) {
        // Revert on error
        setAcknowledged(!newState);
        setCount((c) => c + (newState ? -1 : 1));
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleToggle}
        disabled={isPending || isOwner || !isAuthenticated}
        aria-pressed={acknowledged}
        aria-label={acknowledged ? "Remove acknowledgment" : "Acknowledge this post"}
        className={`group/btn flex items-center gap-2.5 py-2 px-4 border transition-all ${
          isOwner || !isAuthenticated
            ? "cursor-default border-charcoal-muted/10"
            : acknowledged
            ? "border-terracotta/30 bg-terracotta/5 hover:bg-transparent hover:border-charcoal-muted/20"
            : "border-charcoal-muted/15 hover:border-terracotta/30 hover:bg-terracotta/5"
        }`}
      >
        {/* Eye icon */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors ${
            acknowledged ? "text-terracotta" : "text-charcoal-muted/40 group-hover/btn:text-terracotta/60"
          }`}
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>

        <span
          className={`text-xs uppercase tracking-wider transition-colors ${
            acknowledged
              ? "text-terracotta"
              : "text-charcoal-muted/50 group-hover/btn:text-charcoal-muted"
          }`}
        >
          {acknowledged ? "I see you" : "I see you"}
        </span>
      </button>

      {count > 0 && (
        <div className="relative">
          <button
            onClick={() => isOwner && setShowWho((s) => !s)}
            className={`text-xs tabular-nums text-charcoal-muted/50 ${
              isOwner
                ? "hover:text-charcoal-muted cursor-pointer underline underline-offset-2 decoration-charcoal-muted/20"
                : "cursor-default"
            }`}
          >
            {count} {count === 1 ? "person" : "people"} saw this
          </button>

          {/* Who acknowledged — visible to author only */}
          {showWho && isOwner && acknowledgers.length > 0 && (
            <div className="absolute top-full left-0 mt-2 py-2 px-3 bg-white border border-charcoal-muted/10 shadow-sm min-w-[160px] z-10">
              <ul className="space-y-1">
                {acknowledgers.map((a) => (
                  <li
                    key={a.username}
                    className="text-xs text-charcoal-muted"
                  >
                    {a.displayName}
                    <span className="text-charcoal-muted/40 ml-1">
                      @{a.username}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
