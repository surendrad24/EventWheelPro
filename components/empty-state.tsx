export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="card card-pad">
      <h2 className="section-title">{title}</h2>
      <p className="muted">{description}</p>
    </div>
  );
}
