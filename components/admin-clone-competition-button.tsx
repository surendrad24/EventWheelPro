"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCloneCompetitionButton({
  competitionId,
  className,
  label = "Clone"
}: {
  competitionId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClone() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/clone`, {
        method: "POST"
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "clone_failed");
      }
      router.push(`/admin/competitions/${body.competition.id}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "clone_failed";
      window.alert(`Clone failed: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className={className ?? "btn-secondary"} onClick={onClone} disabled={loading}>
      {loading ? "Cloning..." : label}
    </button>
  );
}
