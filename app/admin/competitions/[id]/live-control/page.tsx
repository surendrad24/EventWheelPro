import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { WheelPreview } from "@/components/wheel-preview";
import { formatDateTime } from "@/lib/format";
import { requireAdminPageRole } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export default async function LiveControlPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPageRole(["super_admin", "moderator"]);

  const { id } = await params;
  const maybeCompetition = store.getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const eventParticipants = store.getParticipants(id);
  const eventSpins = store.listSpins(id);
  const latestSpin = eventSpins[0];
  const fairnessRecords = store.listSpinFairnessRecords(id);
  const latestFairness = fairnessRecords[0];

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
            <h2 className="section-title">Fairness proof</h2>
            {!latestFairness && <div className="muted">No fairness record yet. Spin once to generate commit/reveal proof.</div>}
            {latestFairness && (
              <>
                <div className="list-item">
                  <strong>Verified: {latestFairness.verified ? "yes" : "no"}</strong>
                  <div className="muted">Algorithm: {latestFairness.algorithm}</div>
                </div>
                <div className="list-item" style={{ fontFamily: "monospace", fontSize: 12 }}>
                  <div>commit: {latestFairness.commitHash.slice(0, 18)}...{latestFairness.commitHash.slice(-10)}</div>
                  <div>reveal: {latestFairness.revealHash.slice(0, 18)}...{latestFairness.revealHash.slice(-10)}</div>
                  <div>seed: {latestFairness.serverSeed.slice(0, 16)}...{latestFairness.serverSeed.slice(-8)}</div>
                  <div>client: {latestFairness.clientSeed}</div>
                  <div>nonce: {latestFairness.nonce}</div>
                  <div>pool/index: {latestFairness.poolSize} / {latestFairness.resolvedIndex}</div>
                </div>
              </>
            )}
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
          {!!fairnessRecords.length && (
            <section className="card card-pad stack">
              <h2 className="section-title">Recent fairness records</h2>
              {fairnessRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="list-item">
                  <strong>{record.spinId}</strong>
                  <div className="muted">{formatDateTime(record.createdAt)} • idx {record.resolvedIndex}/{record.poolSize} • {record.verified ? "verified" : "invalid"}</div>
                </div>
              ))}
            </section>
          )}
        </aside>
      </section>
    </AdminShell>
  );
}
