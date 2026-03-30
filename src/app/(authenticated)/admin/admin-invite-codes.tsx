"use client";

type InviteCode = {
  id: number;
  code: string;
  createdByName: string;
  usedByName: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

function getStatus(code: InviteCode): "available" | "used" | "expired" {
  if (code.usedAt) return "used";
  if (new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

export function AdminInviteCodes({ codes }: { codes: InviteCode[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-charcoal-muted border-b border-charcoal-muted/15">
            <th className="py-3 pr-4">Code</th>
            <th className="py-3 pr-4">Created By</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Used By</th>
            <th className="py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => {
            const status = getStatus(code);
            const createdDate = new Date(code.createdAt).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            );

            return (
              <tr
                key={code.id}
                className="border-b border-charcoal-muted/10"
              >
                <td className="py-3 pr-4">
                  <code
                    className={`font-mono text-xs tracking-wider ${
                      status !== "available"
                        ? "text-charcoal-muted/40"
                        : "text-charcoal"
                    }`}
                  >
                    {code.code}
                  </code>
                </td>
                <td className="py-3 pr-4 text-charcoal-muted">
                  {code.createdByName}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs uppercase tracking-wider ${
                      status === "available"
                        ? "text-sage"
                        : status === "used"
                        ? "text-charcoal-muted/50"
                        : "text-error/60"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-charcoal-muted">
                  {code.usedByName || "—"}
                </td>
                <td className="py-3 text-charcoal-muted text-xs">
                  {createdDate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
