"use client";

import { useEffect, useMemo, useState } from "react";
import { matrixWheelWinners } from "@/lib/matrix-data";

const wheelColors = ["#00ff33", "#18e615", "#8dff00", "#f1ff00", "#00f83a", "#72ff0b"];

const staticParticipants = [
  { username: "PK Team Matrix", binanceId: "96******73", wallet: "0x9a*****************************eFF7" },
  { username: "Feeha", binanceId: "11******56", wallet: "0x67*****************************4dd8" },
  { username: "BTCDRAMA-TEAM Matrix", binanceId: "86******80", wallet: "0x08*****************************eEFb" },
  { username: "dranees7", binanceId: "19******90", wallet: "0x80*****************************CE84" },
  { username: "Wilber Delarme BNB", binanceId: "71******66", wallet: "0xeb*****************************c6E9" },
  { username: "Olessumyk", binanceId: "11******18", wallet: "0x60*****************************2fcd" },
  { username: "SA - TEAM MATRIX", binanceId: "11******82", wallet: "0xc1*****************************9503" },
  { username: "Danknik", binanceId: "10******92", wallet: "0xfD*****************************F251" },
  { username: "MD Yash Khan-TEAM MATRIX", binanceId: "12******48", wallet: "0x36*****************************03ba" },
  { username: "Babyalexya-TEAM MATRIX-TINKTANK", binanceId: "50******55", wallet: "0x44*****************************f8c7" },
  { username: "DarkRider-Team Matrix TinkTank", binanceId: "51******85", wallet: "0x3e*****************************03e6" },
  { username: "SJ89-TEAM Matrix -TinkTank", binanceId: "72******68", wallet: "0x50*****************************a9Ec" },
  { username: "DEATH NOTE- TEAM MATRIX", binanceId: "49******13", wallet: "0x69*****************************F157" },
  { username: "Md_Rafikul_Islam", binanceId: "34******67", wallet: "0xd5*****************************cc57" },
  { username: "B-BOYZ1616bf", binanceId: "46******34", wallet: "0x87*****************************5172" },
  { username: "Becky Gingerich M3bd", binanceId: "46******22", wallet: "0x4a*****************************345e" },
  { username: "LEGEND SK-TEAM MATRIX", binanceId: "11******93", wallet: "0xf5*****************************f791" },
  { username: "OVMARS - TEAM MATRIX", binanceId: "77******35", wallet: "0x1b*****************************1839" },
  { username: "VIKRANT-TEAM MATRIX-TINKTANK", binanceId: "19******43", wallet: "0x94*****************************b1Fc" }
];

const staticWinners = staticParticipants.slice(0, 3);
const staticWheelEntries = staticParticipants.map((entry) => entry.username);

function wheelNameLabel(name: string) {
  return name.length > 11 ? `${name.slice(0, 11)}..` : name;
}

export function MatrixWheelClient() {
  const [participants, setParticipants] = useState(staticParticipants);
  const [winners, setWinners] = useState(staticWinners.length ? staticWinners : matrixWheelWinners);
  const [wheelEntries] = useState(staticWheelEntries);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [activeWinner, setActiveWinner] = useState(matrixWheelWinners[0]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const end = Date.now() + 30 * 60 * 1000;
    const interval = window.setInterval(() => {
      setTimeLeft(Math.max(0, end - Date.now()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = useMemo(() => {
    const total = Math.floor(timeLeft / 1000);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

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
    setParticipants((current) => current.filter((item) => item.username !== winner.username));
    setWinners((current) => [winner, ...current]);
    window.setTimeout(() => setShowWinner(true), 2600);
  };

  const joinCompetition = (formData: FormData) => {
    const username = String(formData.get("username") || "").trim();
    const binanceId = String(formData.get("binanceId") || "").trim();
    const wallet = String(formData.get("wallet") || "").trim();

    if (!username || !binanceId || !wallet) {
      return;
    }

    setParticipants((current) => [{ username, binanceId, wallet }, ...current]);
    setShowJoin(false);
  };

  return (
    <>
      <section className="matrix-page-head matrix-wheel-head">
        <div className="eyebrow">TINKTANK PARTY WHEEL</div>
        <h1 className="title-lg">Register For The Next Live Spin Event</h1>
        <p className="matrix-wheel-subline">STARTING</p>
        <p className="matrix-wheel-subline matrix-wheel-subline-accent">THE FIRST CHANCE WE GET</p>
      </section>

      <section className="matrix-wheel-steps">
        {[
          ["Own $TANK", "Hold $TANK in your Web3 wallet to qualify.", "Buy Now"],
          ["Enter Competition", "Register with your Binance Nickname, ID & Wallet.", "Join Competition"],
          ["Be Live to Win", "You must be present in the live stream to claim your prize!", "Live Rules"]
        ].map(([title, text, cta], index) => (
          <article key={title} className="matrix-wheel-step-card">
            <div className="matrix-wheel-step-number">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="matrix-wheel-step-btn" onClick={() => setShowJoin(title === "Enter Competition")}>
              {cta}
            </button>
            {title === "Enter Competition" ? <div className="matrix-wheel-step-foot">VISIT MATRIXCLAN.COM/WHEEL TO JOIN</div> : null}
          </article>
        ))}
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
                        key={name}
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

          <section className="matrix-wheel-rules-box">
            <h2>How To Enter</h2>
            <ul>
              <li>1. HOLD $TANK in your wallet.</li>
              <li>2. REGISTER for the competition.</li>
              <li>3. BE LIVE in the stream to claim your prize.</li>
            </ul>
            <h2>Double Your Prize</h2>
            <p>Change your Binance Nickname to include &quot; - TEAM MATRIX - TINKTANK&quot; to DOUBLE your standard win.</p>
            <h2>Prize Pool ($25 BNB)</h2>
            <p>Standard Win: $1 BNB. Grand Prize (Winner of Winners): $5 BNB. Total Pool: $25 BNB to be won.</p>
            <h2>Process & Payments</h2>
            <p>Winners are removed from the wheel and added to the leaderboard. Prizes are sent to the supplied wallet within 48 hours.</p>
          </section>

          <section className="matrix-wheel-market-box">
            <h2>Market Data & Tokenomics</h2>
            <div className="matrix-wheel-market-chart">
              <span>TradingView chart loading...</span>
            </div>
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
                <div key={participant.username} className="matrix-participant">
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
        <button className="matrix-wheel-cta-accent" onClick={handleSpin}>Spin Wheel</button>
      </div>

      {showJoin ? (
        <div className="matrix-modal-backdrop" onClick={() => setShowJoin(false)}>
          <div className="matrix-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowJoin(false)}>×</button>
            <h2>Join Competition</h2>
            <form action={joinCompetition} className="matrix-form">
              <label><span>Username</span><input name="username" placeholder="Username" /></label>
              <label><span>Binance ID</span><input name="binanceId" placeholder="12345678" /></label>
              <label><span>Wallet</span><input name="wallet" placeholder="0x..." /></label>
              <label className="matrix-checkbox"><input type="checkbox" required /> I hold $TANK in this wallet</label>
              <label className="matrix-checkbox"><input type="checkbox" required /> I will be in the live stream</label>
              <button className="matrix-submit-btn" type="submit">ENTER NOW</button>
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
              {winners.map((winner) => (
                <div key={`${winner.username}-${winner.binanceId}`} className="matrix-participant">
                  <strong>{winner.username}</strong>
                  <span>ID: {winner.binanceId}</span>
                  <span>{winner.wallet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showWinner ? (
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
