"use client";

import { generateInviteCodeAction } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type InviteCode = {
  id: number;
  code: string;
  usedByName: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

export function InviteCodeList({
  codes,
  canGenerate,
}: {
  codes: InviteCode[];
  canGenerate: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateInviteCodeAction();
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleCopy(code: string, id: number) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getStatus(code: InviteCode): "available" | "used" | "expired" {
    if (code.usedAt) return "used";
    if (new Date(code.expiresAt) < new Date()) return "expired";
    return "available";
  }

  return (
    <div>
      {error && (
        <div role="alert" className="text-error text-sm mb-4 font-[family-name:var(--font-body)]">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isPending}
        className="mb-8 py-2.5 px-6 bg-charcoal text-cream text-xs uppercase tracking-[0.15em] hover:bg-charcoal-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Generating..." : "Generate invite code"}
      </button>

      {codes.length === 0 ? (
        <p className="text-sm text-charcoal-muted/60 font-[family-name:var(--font-body)] italic">
          No invite codes generated yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {codes.map((code) => {
            const status = getStatus(code);
            return (
              <li
                key={code.id}
                className="flex items-center justify-between py-3 border-b border-charcoal-muted/10"
              >
                <div className="flex items-center gap-4">
                  <code
                    className={`font-mono text-sm tracking-wider ${
                      status === "available"
                        ? "text-charcoal"
                        : "text-charcoal-muted/50 line-through"
                    }`}
                  >
                    {code.code}
                  </code>
                  <span
                    className={`text-xs uppercase tracking-wider ${
                      status === "available"
                        ? "text-sage"
                        : status === "used"
                        ? "text-charcoal-muted/50"
                        : "text-error/60"
                    }`}
                  >
                    {status === "used"
                      ? `Used by ${code.usedByName}`
                      : status === "expired"
                      ? "Expired"
                      : "Available"}
                  </span>
                </div>

                {status === "available" && (
                  <button
                    onClick={() => handleCopy(code.code, code.id)}
                    className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors"
                  >
                    {copiedId === code.id ? "Copied" : "Copy"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
