"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Competition, Participant, Winner } from "@/lib/types";

const wheelColors = ["#00ff33", "#18e615", "#8dff00", "#f1ff00", "#00f83a", "#72ff0b"];

type WheelParticipant = {
  id: string;
  username: string;
  binanceId: string;
  wallet: string;
  country: string;
};

function toWheelParticipant(participant: Participant): WheelParticipant {
  return {
    id: participant.id,
    username: participant.displayName,
    binanceId: participant.exchangeId ?? "N/A",
    wallet: participant.walletAddress ?? "N/A",
    country: participant.country
  };
}

function winnerToParticipant(winner: Winner): WheelParticipant {
  return {
    id: winner.id,
    username: winner.displayName,
    binanceId: winner.participantId,
    wallet: winner.transactionReference ?? "On record",
    country: "-"
  };
}

function wheelNameLabel(name: string) {
  return name.length > 11 ? `${name.slice(0, 11)}..` : name;
}

export function MatrixWheelClient({
  competition,
  participants: initialParticipants,
  winners: initialWinners
}: {
  competition: Competition;
  participants: Participant[];
  winners: Winner[];
}) {
  const [participants, setParticipants] = useState<WheelParticipant[]>(initialParticipants.map(toWheelParticipant));
  const [winners, setWinners] = useState<WheelParticipant[]>(initialWinners.map(winnerToParticipant));
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [activeWinner, setActiveWinner] = useState<WheelParticipant | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const closeAt = new Date(competition.registrationCloseAt).getTime();
    const interval = window.setInterval(() => {
      setTimeLeft(Math.max(0, closeAt - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [competition.registrationCloseAt]);

  const timeLabel = useMemo(() => {
    const total = Math.floor(timeLeft / 1000);
    const hours = String(Math.floor(total / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [timeLeft]);

  const wheelEntries = useMemo(() => participants.map((entry) => entry.username), [participants]);

  const wheelGradient = useMemo(() => {
    if (!wheelEntries.length) {
      return "";
    }
    const segment = 360 / wheelEntries.length;
    return wheelEntries
      .map((_, index) => `${wheelColors[index % wheelColors.length]} ${segment * index}deg ${segment * (index + 1)}deg`)
      .join(", ");
  }, [wheelEntries]);

  const handleSpin = () => {
    if (!participants.length) {
      return;
    }

    const winner = participants[Math.floor(Math.random() * participants.length)];
    setRotation((value) => value + 1260 + Math.floor(Math.random() * 360));
    setActiveWinner(winner);
    setParticipants((current) => current.filter((item) => item.id !== winner.id));
    setWinners((current) => [winner, ...current]);
    window.setTimeout(() => setShowWinner(true), 2600);
  };

  async function refreshCompetitionData() {
    const [participantsResponse, winnersResponse] = await Promise.all([
      fetch(`/api/public/competitions/${competition.slug}/participants`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}/winners`, { cache: "no-store" })
    ]);
    const participantsBody = await participantsResponse.json().catch(() => ({}));
    const winnersBody = await winnersResponse.json().catch(() => ({}));
    if (participantsResponse.ok) {
      setParticipants(((participantsBody.participants ?? []) as Participant[]).map(toWheelParticipant));
    }
    if (winnersResponse.ok) {
      setWinners(((winnersBody.winners ?? []) as Winner[]).map(winnerToParticipant));
    }
  }

  async function joinCompetition(formData: FormData) {
    setJoining(true);
    setJoinError(null);
    try {
      const payload = {
        displayName: String(formData.get("username") ?? "").trim(),
        exchangeId: String(formData.get("binanceId") ?? "").trim(),
        walletAddress: String(formData.get("wallet") ?? "").trim(),
        country: String(formData.get("country") ?? "India").trim()
      };
      if (!payload.displayName || !payload.exchangeId || !payload.walletAddress) {
        throw new Error("required_fields_missing");
      }
      const response = await fetch(`/api/public/competitions/${competition.slug}/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "registration_failed");
      }
      await refreshCompetitionData();
      setShowJoin(false);
    } catch (error) {
      const text = error instanceof Error ? error.message : "registration_failed";
      setJoinError(`Join failed: ${text}`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <>
      <section className="matrix-page-head matrix-wheel-head">
        <div className="eyebrow">{competition.title}</div>
        <h1 className="title-lg">Register For The Next Live Spin Event</h1>
        <p className="matrix-wheel-subline">{competition.status.toUpperCase()}</p>
        <p className="matrix-wheel-subline matrix-wheel-subline-accent">{competition.announcementText || "Community event is now open."}</p>
        <div className="wrap" style={{ justifyContent: "center" }}>
          <Link className="matrix-wheel-cta-primary" href={`/competitions/${competition.slug}`}>Open Competition</Link>
          <Link className="matrix-wheel-cta-secondary" href={`/competitions/${competition.slug}/leaderboard`}>Leaderboard</Link>
          <Link className="matrix-wheel-cta-secondary" href={`/competitions/${competition.slug}/winners`}>Winners</Link>
        </div>
      </section>

      <div className="matrix-wheel-main-grid">
        <section className="matrix-wheel-left">
          <div className="matrix-wheel-status-grid">
            <div className="matrix-wheel-status-card">
              <div className="matrix-wheel-status-number">{participants.length}</div>
              <div className="matrix-wheel-status-label">Participants</div>
            </div>
            <div className="matrix-wheel-status-card">
              <div className="matrix-wheel-status-number">{timeLabel}</div>
              <div className="matrix-wheel-status-label">Time Left</div>
            </div>
            <div className="matrix-wheel-status-card">
              <div className="matrix-wheel-status-number">{winners.length}</div>
              <div className="matrix-wheel-status-label">Total Winners</div>
            </div>
          </div>

          <section className="matrix-wheel-panel matrix-wheel-panel-upgraded">
            <div className="matrix-wheel-pointer" />
            <div className="matrix-wheel-stage">
              <div
                className="matrix-wheel-disc"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  background: wheelEntries.length ? `conic-gradient(from -90deg, ${wheelGradient})` : "#000"
                }}
              >
                {wheelEntries.length ? (
                  <div className="matrix-wheel-labels">
                    {wheelEntries.map((name, index) => (
                      <span
                        key={`${name}-${index}`}
                        className="matrix-wheel-label-chip"
                        style={{ transform: `rotate(${(360 / wheelEntries.length) * index}deg) translate(0, -164px) rotate(90deg)` }}
                      >
                        {wheelNameLabel(name)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="matrix-empty-wheel">No Participants</div>
                )}
              </div>
            </div>
            <div className="matrix-wheel-actions">
              <button className="matrix-wheel-cta-primary" onClick={() => setShowJoin(true)}>Join Now</button>
              <button className="matrix-wheel-cta-secondary" onClick={() => setShowLeaderboard(true)}>Leaderboard</button>
            </div>
          </section>
        </section>

        <aside className="matrix-wheel-right">
          <section className="matrix-wheel-buy-box">
            <a className="matrix-wheel-buy-btn" href="https://four.meme/token/0x45075a5d1b236df7ad007fd34294dad2380a4444" target="_blank" rel="noreferrer">
              BUY $TANK
            </a>
            <div className="matrix-wheel-price-row">
              <span className="matrix-wheel-live-dot" />
              LIVE: $0.000042 (+979%)
            </div>
          </section>

          <section className="matrix-wheel-participants-box">
            <h2><i className="fas fa-users" /> Entrants</h2>
            <div className="matrix-participants-list">
              {participants.length ? participants.map((participant) => (
                <div key={participant.id} className="matrix-participant">
                  <strong>{participant.username}</strong>
                  <span>ID: {participant.binanceId}</span>
                  <span>Wallet: {participant.wallet}</span>
                </div>
              )) : <div className="matrix-empty-entrants">No Participants</div>}
            </div>
          </section>
        </aside>
      </div>

      <div className="matrix-wheel-admin-row">
        <button className="matrix-wheel-cta-accent" onClick={handleSpin}>Spin Wheel (Demo)</button>
      </div>

      {showJoin ? (
        <div className="matrix-modal-backdrop" onClick={() => setShowJoin(false)}>
          <div className="matrix-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowJoin(false)}>×</button>
            <h2>Join Competition</h2>
            <form action={joinCompetition} className="matrix-form">
              <label><span>Username</span><input name="username" placeholder="Username" required /></label>
              <label><span>Binance ID</span><input name="binanceId" placeholder="12345678" required /></label>
              <label><span>Wallet</span><input name="wallet" placeholder="0x..." required /></label>
              <label><span>Country</span><input name="country" placeholder="Country" defaultValue="India" /></label>
              <label className="matrix-checkbox"><input type="checkbox" required /> I hold $TANK in this wallet</label>
              <label className="matrix-checkbox"><input type="checkbox" required /> I will be in the live stream</label>
              <button className="matrix-submit-btn" type="submit" disabled={joining}>{joining ? "Submitting..." : "ENTER NOW"}</button>
              {joinError ? <p className="muted" style={{ color: "#ff5cb2" }}>{joinError}</p> : null}
            </form>
          </div>
        </div>
      ) : null}

      {showLeaderboard ? (
        <div className="matrix-modal-backdrop" onClick={() => setShowLeaderboard(false)}>
          <div className="matrix-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowLeaderboard(false)}>×</button>
            <h2>Recent Winners</h2>
            <div className="matrix-leaderboard-list">
              {winners.map((winner, index) => (
                <div key={`${winner.id}-${index}`} className="matrix-participant">
                  <strong>{winner.username}</strong>
                  <span>ID: {winner.binanceId}</span>
                  <span>{winner.wallet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showWinner && activeWinner ? (
        <div className="matrix-modal-backdrop" onClick={() => setShowWinner(false)}>
          <div className="matrix-modal matrix-winner-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowWinner(false)}>×</button>
            <h2>WE HAVE A WINNER!</h2>
            <div className="matrix-winner-emoji">🏆</div>
            <div className="matrix-winner-name">{activeWinner.username}</div>
            <div className="matrix-winner-id">ID: {activeWinner.binanceId}</div>
            <div className="matrix-winner-id">{activeWinner.wallet}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
