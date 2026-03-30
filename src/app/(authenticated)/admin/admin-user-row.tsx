"use client";

import { useState, useTransition } from "react";
import { grantInviteCodesAction, adminDeleteUserAction } from "@/lib/admin-actions";
import { useRouter } from "next/navigation";

type UserData = {
  id: number;
  displayName: string;
  username: string;
  email: string;
  role: string;
  postCount: number;
  inviteCodesRemaining: number;
  createdAt: string;
};

export function AdminUserRow({
  user,
  isCurrentUser,
}: {
  user: UserData;
  isCurrentUser: boolean;
}) {
  const router = useRouter();
  const [showGrant, setShowGrant] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteUserAction(user.id);
      setShowDelete(false);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-charcoal-muted/10">
      <td className="py-3 pr-4">
        <div>
          <span className="text-charcoal font-medium">{user.displayName}</span>
          <span className="text-charcoal-muted/50 ml-1 text-xs">
            @{user.username}
          </span>
          {user.role === "admin" && (
            <span className="ml-2 text-xs text-terracotta">admin</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-charcoal-muted">{user.email}</td>
      <td className="py-3 pr-4 text-charcoal-muted tabular-nums">
        {user.postCount}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-charcoal-muted tabular-nums">
            {user.inviteCodesRemaining}
          </span>
          {showGrant ? (
            <form
              action={async (formData: FormData) => {
                await grantInviteCodesAction(undefined, formData);
                setShowGrant(false);
                router.refresh();
              }}
              className="flex items-center gap-1"
            >
              <input type="hidden" name="userId" value={user.id} />
              <input
                name="count"
                type="number"
                min="1"
                defaultValue="3"
                className="w-12 border-b border-charcoal-muted/30 bg-transparent text-xs text-center py-0.5"
              />
              <button
                type="submit"
                className="text-xs text-terracotta hover:text-terracotta-light"
              >
                Grant
              </button>
              <button
                type="button"
                onClick={() => setShowGrant(false)}
                className="text-xs text-charcoal-muted"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowGrant(true)}
              className="text-xs text-charcoal-muted/40 hover:text-terracotta transition-colors"
            >
              +
            </button>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-charcoal-muted text-xs">{joinDate}</td>
      <td className="py-3 text-right">
        {!isCurrentUser && (
          <>
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
                className="text-xs text-charcoal-muted/30 hover:text-error transition-colors"
              >
                Delete
              </button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
