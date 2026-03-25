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
    binanceId: "N/A",
    wallet: winner.transactionReference ?? "On record",
    country: "-"
  };
}

function wheelNameLabel(name: string) {
  return name.length > 11 ? `${name.slice(0, 11)}..` : name;
}

function normalizeFlipDigits(input: string) {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(0, 10);
  }
  return digitsOnly.padEnd(10, "0");
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
  const [competitionState, setCompetitionState] = useState<Competition>(competition);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [flipDigits, setFlipDigits] = useState<string[]>(Array.from({ length: 10 }, () => "A"));
  const isFlipGame = competitionState.gameType === "flip_to_win";

  useEffect(() => {
    const closeAt = new Date(competitionState.registrationCloseAt).getTime();
    const interval = window.setInterval(() => {
      setTimeLeft(Math.max(0, closeAt - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [competitionState.registrationCloseAt]);

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

  async function refreshCompetitionData() {
    const [participantsResponse, winnersResponse, competitionResponse] = await Promise.all([
      fetch(`/api/public/competitions/${competition.slug}/participants`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}/winners`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}`, { cache: "no-store" })
    ]);
    const participantsBody = await participantsResponse.json().catch(() => ({}));
    const winnersBody = await winnersResponse.json().catch(() => ({}));
    const competitionBody = await competitionResponse.json().catch(() => ({}));
    if (participantsResponse.ok) {
      setParticipants(((participantsBody.participants ?? []) as Participant[]).map(toWheelParticipant));
    }
    if (winnersResponse.ok) {
      setWinners(((winnersBody.winners ?? []) as Winner[]).map(winnerToParticipant));
    }
    if (competitionResponse.ok && competitionBody.competition) {
      setCompetitionState(competitionBody.competition as Competition);
    }
  }

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      refreshCompetitionData().catch(() => undefined);
    }, 12000);
    return () => window.clearInterval(syncInterval);
  }, [competition.slug]);

  useEffect(() => {
    if (!isFlipGame) {
      return;
    }
    if (!winners.length) {
      setFlipDigits(Array.from({ length: 10 }, () => "A"));
      return;
    }
    setFlipDigits(normalizeFlipDigits(winners[0].binanceId).split(""));
  }, [isFlipGame, winners]);

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
        <h1 className="title-lg">{competitionState.title.toUpperCase()} - REGISTER NOW FOR THE NEXT EVENT</h1>
        <p className="matrix-wheel-subline">STARTING</p>
        <p className="matrix-wheel-subline matrix-wheel-subline-accent">THE FIRST CHANCE WE GET</p>
      </section>

      <section className="matrix-wheel-steps">
        <article className="matrix-wheel-step-card">
          <div className="matrix-wheel-step-number">1</div>
          <h3>Own $TANK</h3>
          <p>Hold $TANK in your Web3 wallet to qualify.</p>
          <a className="matrix-wheel-step-btn" href="https://four.meme/token/0x45075a5d1b236df7ad007fd34294dad2380a4444" target="_blank" rel="noreferrer">
            Buy Now
          </a>
        </article>
        <article className="matrix-wheel-step-card">
          <div className="matrix-wheel-step-number">2</div>
          <h3>Enter Competition</h3>
          <p>Register with your Binance Nickname, ID and wallet.</p>
          <button className="matrix-wheel-step-btn" type="button" onClick={() => setShowJoin(true)}>Join Competition</button>
          <div className="matrix-wheel-step-foot">VISIT MATRIXCLAN.COM/WHEEL TO JOIN</div>
        </article>
        <article className="matrix-wheel-step-card">
          <div className="matrix-wheel-step-number">3</div>
          <h3>Be Live to Win</h3>
          <p>You must be present in the live stream to claim your prize!</p>
        </article>
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
            {!isFlipGame ? <div className="matrix-wheel-pointer" /> : null}
            <div className="matrix-wheel-stage">
              {isFlipGame ? (
                <div className="matrix-flip-board">
                  {flipDigits.map((digit, index) => (
                    <div key={`${digit}-${index}`} className="matrix-flip-slot">
                      {digit}
                    </div>
                  ))}
                </div>
              ) : (
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
              )}
            </div>
            <div className="matrix-wheel-actions">
              <button className="matrix-wheel-cta-primary" onClick={() => setShowJoin(true)}>Join Now</button>
              <button className="matrix-wheel-cta-secondary" onClick={() => setShowLeaderboard(true)}>Leaderboard</button>
            </div>
          </section>

          <section className="matrix-wheel-rules-box">
            <h2>How To Enter</h2>
            <ul>
              <li>1. HOLD $TANK in your wallet.</li>
              <li>2. REGISTER for the competition.</li>
              <li>3. BE LIVE in the stream to claim your prize.</li>
            </ul>
            <h2>Double Your Prize</h2>
            <p>Change your Binance Nickname to include &quot; - TEAM MATRIX - TINKTANK&quot; to DOUBLE your standard win!</p>
            <h2>Prize Pool ($25 BNB)</h2>
            <ul>
              <li>Standard Win: $1 BNB (Doubles to $2 with nickname change)</li>
              <li>Grand Prize (Winner of Winners): $5 BNB (No multiplier)</li>
              <li>Total Pool: $25 BNB to be won!</li>
            </ul>
            <h2>Process &amp; Payments</h2>
            <ul>
              <li>Winners are removed from the wheel and added to the Leaderboard.</li>
              <li>Winner of Winners draw happens at the end of the live.</li>
              <li>Prizes sent to your supplied wallet within 48 hours.</li>
            </ul>
          </section>

          <section className="matrix-wheel-market-box">
            <h2>Market Data &amp; Tokenomics</h2>
            <div className="matrix-wheel-market-chart">Loading chart...</div>
            <div className="matrix-wheel-market-token">
              <strong>BURNTANK WALLET</strong>
              <span>0x0000...BURNTANK</span>
              <small>Click to copy address</small>
            </div>
            <div className="matrix-wheel-market-token">
              <strong>COMMUNITY TREASURY</strong>
              <span>0x63E2...A576</span>
              <small>Click to copy address</small>
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

      {showJoin ? (
        <div className="matrix-modal-backdrop" onClick={() => setShowJoin(false)}>
          <div className="matrix-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowJoin(false)}>×</button>
            <h2>Join Competition</h2>
            <form action={joinCompetition} className="matrix-form">
              <label><span>Username</span><input name="username" placeholder="Username" required /></label>
              <label><span>Binance ID</span><input name="binanceId" placeholder="1234567890" required /></label>
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

    </>
  );
}
