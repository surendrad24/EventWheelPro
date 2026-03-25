import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { WheelPreview } from "@/components/wheel-preview";
import { formatDateTime } from "@/lib/format";
import { requireAdminPageRole } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

function getTimeLeft(targetIso: string) {
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) {
    return "00:00";
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

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
  const timeLeft = getTimeLeft(competition.eventEndAt);
  const participantList = eventParticipants.slice(0, 16);

  return (
    <AdminShell
      title="Live Control"
      description="Spin management, fairness logging, and round-by-round winner operations."
    >
      <section className="live-console card card-pad stack">
        <div className="live-console__brand">
          <div className="live-console__brand-title">BINANCE</div>
          <div className="live-console__brand-sub">@EarnPii - TEAM MATRIX</div>
        </div>
        <div className="ticker">
          <span>
            MATRIXCLAN.COM/WHEEL Welcome to the BTC Team Matrix Party. Please provide ID to be added. By TinkTank on four.meme.
          </span>
        </div>

        <div className="live-console__stats">
          <article className="live-stat">
            <div className="live-stat__value">{eventParticipants.length}</div>
            <div className="live-stat__label">Participants</div>
          </article>
          <article className="live-stat">
            <div className="live-stat__value">{timeLeft}</div>
            <div className="live-stat__label">Time Left</div>
          </article>
          <article className="live-stat">
            <div className="live-stat__value">{store.listWinners(id).length}</div>
            <div className="live-stat__label">Total Winners</div>
          </article>
        </div>

        <div className="live-console__main">
          <article className="live-console__wheel-panel">
            <WheelPreview entrants={eventParticipants} highlight={latestSpin?.resultDisplayName} theme="matrix" />
            <div className="wrap" style={{ justifyContent: "center" }}>
              <button className="btn">Join Competition</button>
              <button className="btn-secondary">Leaderboard</button>
              <button className="btn-ghost">Start Spin</button>
            </div>
          </article>
          <aside className="live-console__participants">
            <h2 className="section-title">Participants</h2>
            <div className="live-console__participant-list">
              {participantList.map((participant) => (
                <article key={participant.id} className="live-console__participant-item">
                  <strong>{participant.displayName}</strong>
                  <div className="muted">ID: {participant.exchangeId ?? "N/A"} • {participant.country}</div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <section className="live-console__details">
          <article className="card card-pad stack">
            <h2 className="section-title">Latest result</h2>
            <div className="list-item">
              <strong>{latestSpin?.resultDisplayName ?? "No spin yet"}</strong>
              <div className="muted">
                {latestSpin ? `${formatDateTime(latestSpin.endedAt)} • ${latestSpin.seedCommitHash}` : "Spin history will appear here."}
              </div>
            </div>
          </article>
          <article className="card card-pad stack">
            <h2 className="section-title">Fairness proof</h2>
            {!latestFairness && <div className="muted">No fairness record yet. Spin once to generate commit/reveal proof.</div>}
            {latestFairness && (
              <div className="list-item" style={{ fontFamily: "monospace", fontSize: 12 }}>
                <div>verified: {latestFairness.verified ? "yes" : "no"}</div>
                <div>commit: {latestFairness.commitHash.slice(0, 18)}...{latestFairness.commitHash.slice(-10)}</div>
                <div>reveal: {latestFairness.revealHash.slice(0, 18)}...{latestFairness.revealHash.slice(-10)}</div>
                <div>seed: {latestFairness.serverSeed.slice(0, 16)}...{latestFairness.serverSeed.slice(-8)}</div>
                <div>client: {latestFairness.clientSeed}</div>
                <div>nonce: {latestFairness.nonce}</div>
                <div>pool/index: {latestFairness.poolSize} / {latestFairness.resolvedIndex}</div>
              </div>
            )}
          </article>
          <article className="card card-pad stack">
            <h2 className="section-title">Spin history</h2>
            {eventSpins.slice(0, 5).map((spin) => (
              <div key={spin.id} className="list-item">
                <strong>Round {spin.roundNumber}: {spin.resultDisplayName}</strong>
                <div className="muted">{formatDateTime(spin.endedAt)} • {spin.rngMode}</div>
              </div>
            ))}
          </article>
        </section>

        <div className="live-console__marquee">#TEAMMATRIX - LIVE STREAMING - WELCOME TO BTC PARTY WHEEL</div>
      </section>
    </AdminShell>
  );
}
