"use client";

import { useState, useTransition } from "react";
import { adminDeletePostAction } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

type PostData = {
  id: number;
  title: string;
  status: string;
  draftStartedAt: string;
  authorName: string;
  authorUsername: string;
};

export function AdminPostRow({ post }: { post: PostData }) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const postDate = new Date(
    post.draftStartedAt + "T12:00:00"
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleDelete() {
    startTransition(async () => {
      await adminDeletePostAction(post.id);
      setShowDelete(false);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-charcoal-muted/10">
      <td className="py-3 pr-4">
        <Link
          href={`/post/${post.id}`}
          className="text-charcoal hover:text-terracotta transition-colors"
        >
          {post.title || "Untitled"}
        </Link>
      </td>
      <td className="py-3 pr-4 text-charcoal-muted">
        {post.authorName}
        <span className="text-charcoal-muted/50 ml-1 text-xs">
          @{post.authorUsername}
        </span>
      </td>
      <td className="py-3 pr-4">
        <span
          className={`text-xs uppercase tracking-wider ${
            post.status === "published" ? "text-sage" : "text-charcoal-muted/50"
          }`}
        >
          {post.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-charcoal-muted text-xs">{postDate}</td>
      <td className="py-3 text-right">
        {showDelete ? (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-error hover:text-error/80"
            >
              {isPending ? "..." : "Confirm"}
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="text-xs text-charcoal-muted"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDelete(true)}
            className="text-xs text-charcoal-muted/50 hover:text-error transition-colors"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
