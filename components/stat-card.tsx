export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <article className="card card-pad">
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{hint}</div>
    </article>
  );
}
