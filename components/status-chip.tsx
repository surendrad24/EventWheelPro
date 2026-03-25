export function StatusChip({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  const className =
    normalized.includes("live") ||
    normalized.includes("approved") ||
    normalized.includes("passed") ||
    normalized.includes("paid") ||
    normalized.includes("verified")
      ? "chip live"
      : normalized.includes("pending") || normalized.includes("processing")
        ? "chip warning"
        : normalized.includes("failed") ||
            normalized.includes("rejected") ||
            normalized.includes("flagged") ||
            normalized.includes("expired")
          ? "chip danger"
          : "chip";

  return <span className={className}>{label.replaceAll("_", " ")}</span>;
}
