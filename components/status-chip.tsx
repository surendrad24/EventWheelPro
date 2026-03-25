export function StatusChip({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const exactMap: Record<string, string> = {
    approved: "chip status-approved",
    pending: "chip status-pending",
    pending_review: "chip status-pending-review",
    flagged_duplicate: "chip status-flagged-duplicate",
    manual_override: "chip status-manual-override",
    passed: "chip status-passed",
    rejected: "chip status-rejected",
    failed: "chip status-failed",
    processing: "chip status-processing",
    verified: "chip status-verified",
    paid: "chip status-paid",
    expired: "chip status-expired",
    won: "chip status-won",
    live: "chip status-live",
    registered: "chip status-registered",
    not_required: "chip status-not-required",
    not_applicable: "chip status-not-applicable"
  };

  const className = exactMap[normalized]
    ?? (
      normalized.includes("pending")
        ? "chip status-pending"
        : normalized.includes("flagged")
          ? "chip status-flagged-duplicate"
          : normalized.includes("approved") || normalized.includes("passed")
            ? "chip status-approved"
            : normalized.includes("rejected") || normalized.includes("failed")
              ? "chip status-rejected"
              : "chip"
    );

  return <span className={className}>{label.replaceAll("_", " ")}</span>;
}
