"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  WheelOfFortune,
  type WheelOfFortunePrize,
  type WheelOfFortuneRef
} from "@matmachry/react-wheel-of-fortune";
import type { Competition, Participant, Winner } from "@/lib/types";

const WHEEL_THEME_COLORS: Record<"matrix-neon" | "matrix-cyber", Array<`#${string}`>> = {
  "matrix-neon": ["#18E3B0", "#00D47A", "#B7FF00", "#25D9D2", "#00C96B", "#D6FF3D"],
  "matrix-cyber": ["#00E5FF", "#00B8D4", "#7C4DFF", "#651FFF", "#00ACC1", "#536DFE"]
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
};

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What does BSC stand for?",
    options: ["Binance Smart Chain", "Bitcoin Secure Chain", "Blockchain Storage Core", "Basic Swap Contract"],
    answerIndex: 0
  },
  {
    id: "q2",
    prompt: "A wallet private key should be:",
    options: ["Shared with moderators", "Kept secret", "Stored in public bio", "Posted for verification"],
    answerIndex: 1
  },
  {
    id: "q3",
    prompt: "Which status means registration is accepted?",
    options: ["pending_review", "flagged_duplicate", "approved", "rejected"],
    answerIndex: 2
  }
];

type WheelParticipant = {
  id: string;
  username: string;
  binanceId: string;
  wallet: string;
  country: string;
};

type LeaderboardEntry = {
  key: string;
  username: string;
  binanceId: string;
  wins: number;
  latestWonAt: string;
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

function wheelNameLabelForDensity(name: string, total: number, step: number) {
  const visibleLabels = Math.max(1, Math.ceil(total / Math.max(1, step)));
  const labelRadius = 142;
  const arcLength = (2 * Math.PI * labelRadius) / visibleLabels;
  const maxChars = Math.max(3, Math.min(14, Math.floor((arcLength - 6) / 7)));
  return name.length > maxChars ? `${name.slice(0, maxChars)}..` : name;
}

function normalizeFlipDigits(input: string) {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(0, 10);
  }
  return digitsOnly.padEnd(10, "0");
}

function randomDigit() {
  return String(Math.floor(Math.random() * 10));
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
  const [winnersRaw, setWinnersRaw] = useState<Winner[]>(initialWinners);
  const [competitionState, setCompetitionState] = useState<Competition>(competition);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [flipDigits, setFlipDigits] = useState<string[]>(Array.from({ length: 10 }, () => "0"));
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wheelTheme, setWheelTheme] = useState<"matrix-neon" | "matrix-cyber">("matrix-neon");
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [spinWinner, setSpinWinner] = useState<WheelParticipant | null>(null);
  const wheelRef = useRef<WheelOfFortuneRef>(null);
  const isSpinningRef = useRef(false);
  const lastSyncedSpinIdRef = useRef<string | null>(null);
  const pendingBackendWinnerRef = useRef<WheelParticipant | null>(null);
  const queuedBackendWinnerRef = useRef<WheelParticipant | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const flipAnimatingRef = useRef(false);
  const queuedFlipWinnerRef = useRef<WheelParticipant | null>(null);
  const showPublicWheelControls = false;
  const isQuizGame = competitionState.gameType === "quiz";
  const isFlipGame = competitionState.gameType === "flip_to_win";
  const currentQuestion = SAMPLE_QUESTIONS[roundIndex];

  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);

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

  const labelStep = useMemo(() => {
    const count = participants.length;
    const maxVisibleLabels = count >= 1000 ? 140 : count >= 500 ? 120 : 90;
    if (count > maxVisibleLabels) return Math.ceil(count / maxVisibleLabels);
    return 1;
  }, [participants.length]);

  const wheelPrizes = useMemo<WheelOfFortunePrize[]>(
    () => {
      const count = participants.length;
      const segmentDegrees = count ? 360 / count : 0;

      return participants.map((entry, index) => {
        const showLabel = labelStep === 1 || index % labelStep === 0;

        return {
          key: entry.id,
          color: WHEEL_THEME_COLORS[wheelTheme][index % WHEEL_THEME_COLORS[wheelTheme].length],
          displayOrientation: "vertical",
          prize: showLabel ? (
            <span className="matrix-wheel-radial-label" style={{ transform: "rotate(-90deg)" }}>
              {wheelNameLabelForDensity(entry.username, count, labelStep)}
            </span>
          ) : "\u200B"
        };
      });
    },
    [participants, labelStep, wheelTheme]
  );

  const wheelDensityClass = useMemo(() => {
    const count = participants.length;
    if (count >= 1000) return "matrix-wheel-lib--1000";
    if (count >= 800) return "matrix-wheel-lib--800";
    if (count >= 600) return "matrix-wheel-lib--600";
    if (count >= 500) return "matrix-wheel-lib--500";
    if (count >= 300) return "matrix-wheel-lib--300";
    if (count >= 150) return "matrix-wheel-lib--150";
    if (count >= 100) return "matrix-wheel-lib--100";
    if (count >= 70) return "matrix-wheel-lib--70";
    if (count >= 50) return "matrix-wheel-lib--50";
    if (count >= 30) return "matrix-wheel-lib--30";
    if (count >= 18) return "matrix-wheel-lib--18";
    return "matrix-wheel-lib--base";
  }, [participants.length]);

  const wheelSamplingClass = labelStep > 1 ? "matrix-wheel-lib--sampled" : "";

  const leaderboardEntries = useMemo<LeaderboardEntry[]>(() => {
    const participantById = new Map(participants.map((entry) => [entry.id, entry]));
    const table = new Map<string, LeaderboardEntry>();

    for (const winner of winnersRaw) {
      const key = winner.participantId || winner.displayName;
      const binanceId = participantById.get(winner.participantId)?.binanceId ?? "N/A";
      const existing = table.get(key);
      if (existing) {
        existing.wins += 1;
        if (winner.wonAt > existing.latestWonAt) {
          existing.latestWonAt = winner.wonAt;
        }
      } else {
        table.set(key, {
          key,
          username: winner.displayName,
          binanceId,
          wins: 1,
          latestWonAt: winner.wonAt
        });
      }
    }

    return Array.from(table.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.latestWonAt.localeCompare(a.latestWonAt);
    });
  }, [winnersRaw, participants]);

  async function refreshCompetitionData() {
    const [participantsResponse, winnersResponse, competitionResponse, spinsResponse] = await Promise.all([
      fetch(`/api/public/competitions/${competition.slug}/participants`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}/winners`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}`, { cache: "no-store" }),
      fetch(`/api/public/competitions/${competition.slug}/spins?limit=1`, { cache: "no-store" })
    ]);
    const participantsBody = await participantsResponse.json().catch(() => ({}));
    const winnersBody = await winnersResponse.json().catch(() => ({}));
    const competitionBody = await competitionResponse.json().catch(() => ({}));
    const spinsBody = await spinsResponse.json().catch(() => ({}));
    const nextParticipants = ((participantsBody.participants ?? []) as Participant[]);
    if (participantsResponse.ok) {
      setParticipants(nextParticipants.map(toWheelParticipant));
    }
    if (winnersResponse.ok) {
      setWinnersRaw((winnersBody.winners ?? []) as Winner[]);
    }
    if (competitionResponse.ok && competitionBody.competition) {
      setCompetitionState(competitionBody.competition as Competition);
    }

    if (spinsResponse.ok) {
      const latestSpin = Array.isArray(spinsBody.spins) ? spinsBody.spins[0] : undefined;
      if (latestSpin?.id) {
        if (!lastSyncedSpinIdRef.current) {
          lastSyncedSpinIdRef.current = latestSpin.id;
        } else if (lastSyncedSpinIdRef.current !== latestSpin.id) {
          lastSyncedSpinIdRef.current = latestSpin.id;
          const winnerParticipant = nextParticipants.find((entry) => entry.id === latestSpin.resultParticipantId);
          const winnerFromSpin: WheelParticipant = winnerParticipant
            ? toWheelParticipant(winnerParticipant)
            : {
              id: latestSpin.resultParticipantId,
              username: latestSpin.resultDisplayName ?? "Winner",
              binanceId: "N/A",
              wallet: "N/A",
              country: "N/A"
            };

          if (isFlipGame) {
            if (flipAnimatingRef.current) {
              queuedFlipWinnerRef.current = winnerFromSpin;
            } else {
              startFlipAnimation(winnerFromSpin);
            }
          } else {
            if (isSpinningRef.current) {
              queuedBackendWinnerRef.current = winnerFromSpin;
            } else {
              pendingBackendWinnerRef.current = winnerFromSpin;
              wheelRef.current?.spin();
            }
          }
        }
      }
    }
  }

  function startFlipAnimation(winner: WheelParticipant) {
    if (flipTimerRef.current) {
      window.clearInterval(flipTimerRef.current);
      flipTimerRef.current = null;
    }

    flipAnimatingRef.current = true;
    setIsSpinning(true);
    setShowWinnerPopup(false);
    setSpinWinner(null);

    const finalDigits = normalizeFlipDigits(winner.binanceId).split("");
    let tick = 0;
    const baseTicks = 22;
    const staggerTicks = finalDigits.length * 2;
    const endTick = baseTicks + staggerTicks;

    flipTimerRef.current = window.setInterval(() => {
      tick += 1;
      setFlipDigits((prev) => prev.map((_, index) => {
        const lockAt = baseTicks + index * 2;
        if (tick >= lockAt) {
          return finalDigits[index] ?? "0";
        }
        return randomDigit();
      }));

      if (tick >= endTick) {
        if (flipTimerRef.current) {
          window.clearInterval(flipTimerRef.current);
          flipTimerRef.current = null;
        }
        setFlipDigits(finalDigits);
        flipAnimatingRef.current = false;
        setIsSpinning(false);
        setSpinWinner(winner);
        setShowWinnerPopup(true);

        if (queuedFlipWinnerRef.current) {
          const queuedWinner = queuedFlipWinnerRef.current;
          queuedFlipWinnerRef.current = null;
          window.setTimeout(() => {
            startFlipAnimation(queuedWinner);
          }, 240);
        }
      }
    }, 75);
  }

  useEffect(() => {
    refreshCompetitionData().catch(() => undefined);
    const syncInterval = window.setInterval(() => {
      refreshCompetitionData().catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(syncInterval);
  }, [competition.slug]);

  useEffect(() => {
    if (!isFlipGame || flipAnimatingRef.current) {
      return;
    }
    if (!winnersRaw.length) {
      setFlipDigits(Array.from({ length: 10 }, () => "0"));
      return;
    }
    const latestWinner = winnersRaw[0];
    const winnerParticipant = participants.find((entry) => entry.id === latestWinner.participantId);
    const winnerDigits = normalizeFlipDigits(winnerParticipant?.binanceId ?? "").split("");
    setFlipDigits(winnerDigits);
  }, [isFlipGame, winnersRaw, participants]);

  useEffect(() => () => {
    if (flipTimerRef.current) {
      window.clearInterval(flipTimerRef.current);
    }
  }, []);

  useEffect(() => {
    setSelectedAnswer(null);
    setSubmitted(false);
  }, [roundIndex]);

  const quizFeedback = useMemo(() => {
    if (!submitted || selectedAnswer === null) {
      return null;
    }
    return selectedAnswer === currentQuestion.answerIndex ? "Correct answer" : "Try next round";
  }, [submitted, selectedAnswer, currentQuestion.answerIndex]);

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
      if (!/^\d{10}$/.test(payload.exchangeId)) {
        throw new Error("binance_id_must_be_10_digits");
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
        <div className="eyebrow">{competitionState.title}</div>
        <div className="matrix-heroes-title-rule" aria-hidden="true" />
        <h1 className="title-lg">{isQuizGame ? "QUIZ ARENA" : "REGISTER NOW FOR THE NEXT EVENT"}</h1>
        <p className="matrix-wheel-subline">{isQuizGame ? "LIVE QUIZ ROUND" : "STARTING"}</p>
        <p className="matrix-wheel-subline matrix-wheel-subline-accent">{isQuizGame ? "ANSWER FAST TO WIN" : "THE FIRST CHANCE WE GET"}</p>
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
              <div className="matrix-wheel-status-number">{winnersRaw.length}</div>
              <div className="matrix-wheel-status-label">Total Winners</div>
            </div>
          </div>

          <section className="matrix-wheel-panel matrix-wheel-panel-upgraded">
            <div className="matrix-wheel-stage">
              {isQuizGame ? (
                <div className="matrix-quiz-inline">
                  <article className="matrix-quiz-card">
                    <div className="matrix-quiz-card-head">
                      <h2>Question Round {roundIndex + 1}</h2>
                    </div>
                    <p className="matrix-quiz-prompt">{currentQuestion.prompt}</p>
                    <div className="matrix-quiz-options">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={option}
                          type="button"
                          className={`matrix-quiz-option ${selectedAnswer === index ? "active" : ""}`}
                          onClick={() => !submitted && setSelectedAnswer(index)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="matrix-wheel-actions matrix-wheel-actions-quiz">
                      <button
                        className="matrix-wheel-cta-primary"
                        type="button"
                        disabled={selectedAnswer === null || submitted}
                        onClick={() => setSubmitted(true)}
                      >
                        Submit Answer
                      </button>
                      <button
                        className="matrix-wheel-cta-secondary"
                        type="button"
                        disabled={roundIndex >= SAMPLE_QUESTIONS.length - 1}
                        onClick={() => setRoundIndex((value) => Math.min(value + 1, SAMPLE_QUESTIONS.length - 1))}
                      >
                        Next Round
                      </button>
                    </div>
                    {quizFeedback ? <p className="matrix-quiz-feedback">{quizFeedback}</p> : null}
                  </article>
                </div>
              ) : isFlipGame ? (
                <div className="live-console__slot-machine matrix-slot-machine-public">
                  <div className="live-console__slot-face">
                    <div className="live-console__slot-payline" aria-hidden="true" />
                    <div className="matrix-flip-board live-console__flip-reels">
                      {flipDigits.map((digit, index) => (
                        <div key={`${digit}-${index}`} className={`matrix-flip-slot${isSpinning ? " flipping" : ""}`}>
                          {digit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                wheelPrizes.length ? (
                  <div className={`matrix-wheel-lib-wrap ${wheelTheme}`} style={{ ["--wheel-segments" as string]: wheelPrizes.length }}>
                    {showPublicWheelControls && (
                      <div className="matrix-wheel-theme-toggle" role="group" aria-label="Wheel theme">
                        <button
                          type="button"
                          className={wheelTheme === "matrix-neon" ? "active" : ""}
                          onClick={() => setWheelTheme("matrix-neon")}
                        >
                          Matrix Neon
                        </button>
                        <button
                          type="button"
                          className={wheelTheme === "matrix-cyber" ? "active" : ""}
                          onClick={() => setWheelTheme("matrix-cyber")}
                        >
                          Matrix Cyber
                        </button>
                      </div>
                    )}
                    <WheelOfFortune
                      ref={wheelRef}
                      className={`matrix-wheel-lib ${wheelDensityClass} ${wheelSamplingClass} ${showPublicWheelControls ? "" : "matrix-wheel-lib-readonly"}`.trim()}
                      prizes={wheelPrizes}
                      wheelPointer={<div className="matrix-wheel-lib-pointer" />}
                      wheelSpinButton={
                        <button
                          type="button"
                          className={`matrix-wheel-lib-spin${showPublicWheelControls ? "" : " matrix-wheel-lib-spin-hidden"}`}
                          disabled={isSpinning || !showPublicWheelControls}
                          tabIndex={showPublicWheelControls ? 0 : -1}
                          aria-hidden={!showPublicWheelControls}
                          onClick={() => {
                            if (isSpinning || !showPublicWheelControls) return;
                            wheelRef.current?.spin();
                          }}
                        >
                          SPIN
                        </button>
                      }
                      onSpinStart={() => {
                        setIsSpinning(true);
                        setShowWinnerPopup(false);
                        setSpinWinner(null);
                      }}
                      onSpinEnd={(prize) => {
                        setIsSpinning(false);
                        const resolved = pendingBackendWinnerRef.current ?? participants.find((entry) => entry.id === prize.key) ?? null;
                        pendingBackendWinnerRef.current = null;
                        if (resolved) {
                          setSpinWinner(resolved);
                          setShowWinnerPopup(true);
                        }
                        if (queuedBackendWinnerRef.current) {
                          pendingBackendWinnerRef.current = queuedBackendWinnerRef.current;
                          queuedBackendWinnerRef.current = null;
                          window.setTimeout(() => {
                            wheelRef.current?.spin();
                          }, 240);
                        }
                      }}
                      animationDurationInMs={4500}
                      wheelRotationsCount={6}
                      wheelBorderColor="#00FF66"
                    />
                  </div>
                ) : (
                  <div className="matrix-empty-wheel">No Participants</div>
                )
              )}
            </div>
            <div className="matrix-wheel-actions">
              <button className="matrix-wheel-cta-primary" onClick={() => setShowJoin(true)}>
                <span aria-hidden="true">🚀</span> Join Now
              </button>
              <button className="matrix-wheel-cta-secondary" onClick={() => setShowLeaderboard(true)}>
                <span aria-hidden="true">🏆</span> Leaderboard
              </button>
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
              <label><span>Binance ID</span><input name="binanceId" placeholder="1234567890" inputMode="numeric" pattern="\d{10}" minLength={10} maxLength={10} required /></label>
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
          <div className="matrix-modal matrix-leaderboard-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setShowLeaderboard(false)}>×</button>
            <h2>🏆 Recent Winners</h2>
            <div className="matrix-leaderboard-list">
              {leaderboardEntries.map((entry, index) => (
                <article
                  key={entry.key}
                  className={`matrix-leaderboard-entry${index < 3 ? " is-podium" : ""}`}
                >
                  <div className="matrix-leaderboard-left">
                    <div className="matrix-leaderboard-rank">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                    </div>
                    <div>
                      <strong>{entry.username}</strong>
                      <span>ID: {entry.binanceId}</span>
                    </div>
                  </div>
                  <div className="matrix-leaderboard-wins">
                    <strong>{entry.wins}</strong>
                    <span>🏆</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showWinnerPopup && spinWinner ? (
        <div className="matrix-winner-backdrop" onClick={() => setShowWinnerPopup(false)}>
          <div className={`matrix-winner-popup ${wheelTheme}`} onClick={(event) => event.stopPropagation()}>
            <div className="matrix-winner-energy" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className="matrix-winner-spark"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${index * 22.5}deg) translateY(-106px)`,
                    animationDelay: `${index * 70}ms`
                  }}
                />
              ))}
            </div>
            <button className="matrix-modal-close" onClick={() => setShowWinnerPopup(false)}>×</button>
            <p className="matrix-winner-kicker">Winner Selected</p>
            <h2 className="matrix-winner-name">{spinWinner.username}</h2>
            <p className="matrix-winner-id">
              Exchange ID: <strong>{spinWinner.binanceId}</strong>
            </p>
            <button className="matrix-submit-btn" type="button" onClick={() => setShowWinnerPopup(false)}>
              Awesome
            </button>
          </div>
        </div>
      ) : null}

    </>
  );
}
