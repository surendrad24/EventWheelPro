import { AdminShell } from "@/components/admin-shell";

export default function TemplatesPage() {
  return (
    <AdminShell
      title="Templates"
      description="Reusable event blueprints help operators launch future competitions without starting from scratch."
    >
      <section className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <article className="card card-pad stack">
          <div className="eyebrow">Template</div>
          <strong>Weekly community spin</strong>
          <div className="muted">Open registration, manual moderation, three prize tiers, public leaderboard.</div>
        </article>
        <article className="card card-pad stack">
          <div className="eyebrow">Template</div>
          <strong>Token gated championship</strong>
          <div className="muted">Wallet checks, min token threshold, public winners off, manual payout review.</div>
        </article>
      </section>
    </AdminShell>
  );
}
