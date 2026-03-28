import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { LiveControlFrame } from "@/components/live-control-frame";
import { LiveControlWheelPanel } from "@/components/live-control-wheel-panel";
import { formatDateTime } from "@/lib/format";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
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
  await requireAdminPagePermission("live_control", "view");

  const { id } = await params;
  const maybeCompetition = store.getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;
  const competitions = store.listCompetitions();

  const eventParticipants = store.getParticipants(id);
  const eventSpins = store.listSpins(id);
  const latestSpin = eventSpins[0];
  const latestResultParticipant = latestSpin
    ? eventParticipants.find((participant) => participant.id === latestSpin.resultParticipantId)
    : undefined;
  const fairnessRecords = store.listSpinFairnessRecords(id);
  const latestFairness = fairnessRecords[0];
  const timeLeft = getTimeLeft(competition.eventEndAt);
  const participantList = eventParticipants.slice(0, 16);

  return (
    <AdminShell title="Live Control" description="Spin management, fairness logging, and round-by-round winner operations.">
      <LiveControlFrame
        competitionId={competition.id}
        competitionOptions={competitions.map((entry) => ({ id: entry.id, title: entry.title }))}
      >
        <section className="live-console card card-pad stack">
          <div className="live-console__brand">
            <div className="live-console__brand-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/binance-logo.svg" alt="Binance" className="live-console__brand-logo" />
            </div>
            <div className="live-console__brand-sub">@ㄒミKku1 ƵミCkø-Øn - FUSION MATRIX</div>
          </div>
          <div className="ticker">
            <span className="ticker__label">LIVE FEED</span>
            <span>
              MATRIXCLAN.COM/WHEEL Welcome to the BTC Fusion Matrix Party. Please provide ID to be added. By TinkTank on four.meme.
            </span>
          </div>

          <div className="live-console__main">
            <article className="live-console__wheel-panel matrix-wheel-panel matrix-wheel-panel-upgraded">
              <LiveControlWheelPanel
                competitionId={competition.id}
                gameType={competition.gameType}
                participants={eventParticipants}
                timeLeft={timeLeft}
                totalWinners={store.listWinners(id).length}
              />
              <section className="live-console__panel-details">
                <article className="card card-pad stack">
                  <h2 className="section-title">Latest result</h2>
                  <div className="list-item">
                    {latestSpin ? (
                      <>
                        <strong>Name: {latestSpin.resultDisplayName}</strong>
                        <div className="muted">Binance ID: {latestResultParticipant?.exchangeId ?? "N/A"}</div>
                        <div className="muted">Location: {latestResultParticipant?.country ?? "N/A"}</div>
                        <div className="muted">{formatDateTime(latestSpin.endedAt)}</div>
                        <div className="muted" style={{ marginTop: 6 }}>{latestSpin.seedCommitHash}</div>
                      </>
                    ) : (
                      <div className="muted">Spin history will appear here.</div>
                    )}
                  </div>
                </article>
                <article className="card card-pad stack">
                  <h2 className="section-title">Fairness proof</h2>
                  {!latestFairness && <div className="muted">No fairness record yet. Spin once to generate commit/reveal proof.</div>}
                  {latestFairness && (
                    <div className="list-item" style={{ fontFamily: "monospace", fontSize: 12 }}>
                      <div>Verified: {latestFairness.verified ? "YES" : "NO"}</div>
                      <div>Commit: {latestFairness.commitHash.slice(0, 18)}...{latestFairness.commitHash.slice(-10)}</div>
                      <div>Reveal: {latestFairness.revealHash.slice(0, 18)}...{latestFairness.revealHash.slice(-10)}</div>
                      <div>Seed: {latestFairness.serverSeed.slice(0, 16)}...{latestFairness.serverSeed.slice(-8)}</div>
                      <div>Client: {latestFairness.clientSeed}</div>
                      <div>Nonce: {latestFairness.nonce}</div>
                      <div>Pool/Index: {latestFairness.poolSize} / {latestFairness.resolvedIndex}</div>
                    </div>
                  )}
                </article>
              </section>
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
          <div className="live-console__wave" />
          <div className="live-console__marquee" aria-label="Live stream ticker">
            <div className="live-console__marquee-track">
              <span>#TEAMMATRIX - LIVE STREAMING - WELCOME TO BTC PARTY WHEEL</span>
              <span aria-hidden="true">#TEAMMATRIX - LIVE STREAMING - WELCOME TO BTC PARTY WHEEL</span>
            </div>
          </div>
        </section>
      </LiveControlFrame>
    </AdminShell>
  );
}
