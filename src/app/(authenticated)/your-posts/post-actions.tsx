"use client";

import { useState } from "react";
import { deletePostAction, unpublishPostAction } from "@/lib/post-actions";

export function PostActions({
  postId,
  status,
}: {
  postId: number;
  status: "draft" | "published";
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-charcoal-muted/60">Delete?</span>
        <form action={() => deletePostAction(postId)}>
          <button
            type="submit"
            className="text-xs uppercase tracking-wider text-red-600 hover:text-red-700 transition-colors"
          >
            Yes
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-charcoal transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      {status === "published" && (
        <form
          style={{ marginTop: "-3px" }}
          action={async () => {
            await unpublishPostAction(postId);
          }}
        >
          <button
            type="submit"
            className="text-xs text-charcoal-muted/50 hover:text-terracotta transition-colors"
          >
            Convert to draft
          </button>
        </form>
      )}
      <button
        onClick={() => setConfirming(true)}
        className="text-xs uppercase tracking-wider text-red-600 hover:text-red-600 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
