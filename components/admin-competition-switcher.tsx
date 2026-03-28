"use client";

import { useRouter } from "next/navigation";

type CompetitionOption = {
  id: string;
  title: string;
};

export function AdminCompetitionSwitcher({
  value,
  options,
  routeSuffix,
  label = "Competition"
}: {
  value: string;
  options: CompetitionOption[];
  routeSuffix: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="matrix-neon-select"
        value={value}
        onChange={(event) => router.push(`/admin/competitions/${event.target.value}/${routeSuffix}`)}
      >
        {options.map((competition) => (
          <option key={competition.id} value={competition.id}>
            {competition.title} ({competition.id})
          </option>
        ))}
      </select>
    </label>
  );
}
