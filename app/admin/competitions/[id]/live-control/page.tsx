import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { WheelPreview } from "@/components/wheel-preview";
import { formatDateTime } from "@/lib/format";
import { getCompetitionById, getCompetitionParticipants, getCompetitionSpins } from "@/lib/mock-data";

export default async function LiveControlPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const maybeCompetition = getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const eventParticipants = getCompetitionParticipants(id);
  const eventSpins = getCompetitionSpins(id);
  const latestSpin = eventSpins.at(-1);

  return (
    <AdminShell
      title="Live Control"
      description="Spin management, fairness logging, and round-by-round winner operations."
    >
      <section className="hero-grid">
        <article className="card card-pad stack" style={{ alignItems: "center" }}>
          <div className="row-between" style={{ width: "100%" }}>
            <StatusChip label={competition.status} />
            <div className="chip">RNG: {latestSpin?.rngMode ?? "basic RNG"}</div>
          </div>
          <WheelPreview entrants={eventParticipants} highlight={latestSpin?.resultDisplayName} />
          <div className="wrap" style={{ justifyContent: "center" }}>
            <button className="btn">Start spin</button>
            <button className="btn-secondary">Pause event</button>
            <button className="btn-ghost">Complete event</button>
          </div>
        </article>

        <aside className="stack">
          <section className="card card-pad stack">
            <h2 className="section-title">Latest result</h2>
            <div className="list-item">
              <strong>{latestSpin?.resultDisplayName ?? "No spin yet"}</strong>
              <div className="muted">
                {latestSpin ? `${formatDateTime(latestSpin.endedAt)} • ${latestSpin.seedCommitHash}` : "Spin history will appear here."}
              </div>
            </div>
          </section>
          <section className="card card-pad stack">
            <h2 className="section-title">Spin history</h2>
            {eventSpins.map((spin) => (
              <div key={spin.id} className="list-item">
                <strong>Round {spin.roundNumber}: {spin.resultDisplayName}</strong>
                <div className="muted">{formatDateTime(spin.endedAt)} • {spin.rngMode}</div>
              </div>
            ))}
          </section>
        </aside>
      </section>
    </AdminShell>
  );
}
