"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  WheelOfFortune,
  type WheelOfFortunePrize,
  type WheelOfFortuneRef
} from "@matmachry/react-wheel-of-fortune";
import type { CompetitionGameType, Participant } from "@/lib/types";

const WHEEL_THEME_COLORS: Record<"matrix-neon" | "matrix-cyber", Array<`#${string}`>> = {
  "matrix-neon": ["#18E3B0", "#00D47A", "#B7FF00", "#25D9D2", "#00C96B", "#D6FF3D"],
  "matrix-cyber": ["#00E5FF", "#00B8D4", "#7C4DFF", "#651FFF", "#00ACC1", "#536DFE"]
};

type WheelParticipant = {
  id: string;
  username: string;
  binanceId: string;
};

function toWheelParticipant(participant: Participant): WheelParticipant {
  return {
    id: participant.id,
    username: participant.displayName,
    binanceId: participant.exchangeId ?? "N/A"
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

export function LiveControlWheelPanel({
  competitionId,
  gameType,
  participants,
  timeLeft,
  totalWinners
}: {
  competitionId: string;
  gameType: CompetitionGameType;
  participants: Participant[];
  timeLeft: string;
  totalWinners: number;
}) {
  const router = useRouter();
  const wheelRef = useRef<WheelOfFortuneRef>(null);
  const backendWinnerRef = useRef<WheelParticipant | null>(null);
  const shouldRefreshRef = useRef(false);
  const flipTimerRef = useRef<number | null>(null);
  const [wheelTheme, setWheelTheme] = useState<"matrix-neon" | "matrix-cyber">("matrix-neon");
  const [isSpinning, setIsSpinning] = useState(false);
  const [flipDigits, setFlipDigits] = useState<string[]>(Array.from({ length: 10 }, () => "0"));
  const [spinError, setSpinError] = useState<string | null>(null);
  const [winner, setWinner] = useState<WheelParticipant | null>(null);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const isFlipGame = gameType === "flip_to_win";

  useEffect(() => () => {
    if (flipTimerRef.current) {
      window.clearInterval(flipTimerRef.current);
    }
  }, []);

  const wheelParticipants = useMemo(() => participants.map(toWheelParticipant), [participants]);

  const labelStep = useMemo(() => {
    const count = wheelParticipants.length;
    const maxVisibleLabels = count >= 1000 ? 140 : count >= 500 ? 120 : 90;
    if (count > maxVisibleLabels) return Math.ceil(count / maxVisibleLabels);
    return 1;
  }, [wheelParticipants.length]);

  const wheelPrizes = useMemo<WheelOfFortunePrize[]>(
    () => {
      const count = wheelParticipants.length;
      return wheelParticipants.map((entry, index) => {
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
    [wheelParticipants, labelStep, wheelTheme]
  );

  const wheelDensityClass = useMemo(() => {
    const count = wheelParticipants.length;
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
  }, [wheelParticipants.length]);

  const wheelSamplingClass = labelStep > 1 ? "matrix-wheel-lib--sampled" : "";

  function startFlipAnimation(resolvedWinner: WheelParticipant) {
    if (flipTimerRef.current) {
      window.clearInterval(flipTimerRef.current);
      flipTimerRef.current = null;
    }
    setIsSpinning(true);
    setShowWinnerPopup(false);
    setWinner(null);

    const finalDigits = normalizeFlipDigits(resolvedWinner.binanceId).split("");
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
        setIsSpinning(false);
        setWinner(resolvedWinner);
        setShowWinnerPopup(true);
        if (shouldRefreshRef.current) {
          shouldRefreshRef.current = false;
          router.refresh();
        }
      }
    }, 75);
  }

  async function executeBackendSpin() {
    if (isSpinning) {
      return;
    }

    setSpinError(null);
    setIsSpinning(true);
    shouldRefreshRef.current = false;
    backendWinnerRef.current = null;

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/spin`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initiatedBy: "live-control-ui", clientSeed: crypto.randomUUID() })
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body.error ?? "spin_failed");
      }

      const participant = body.participant as Participant | undefined;
      const resolvedWinner = participant ? toWheelParticipant(participant) : null;
      if (participant) {
        backendWinnerRef.current = resolvedWinner;
      }
      shouldRefreshRef.current = true;
      if (isFlipGame && resolvedWinner) {
        startFlipAnimation(resolvedWinner);
      } else {
        wheelRef.current?.spin();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "spin_failed";
      setSpinError(`Spin failed: ${message}`);
      setIsSpinning(false);
    }
  }

  return (
    <>
      <div className="matrix-wheel-status-grid">
        <div className="matrix-wheel-status-card">
          <div className="matrix-wheel-status-number">{wheelParticipants.length}</div>
          <div className="matrix-wheel-status-label">Participants</div>
        </div>
        <div className="matrix-wheel-status-card">
          <div className="matrix-wheel-status-number">{timeLeft}</div>
          <div className="matrix-wheel-status-label">Time Left</div>
        </div>
        <div className="matrix-wheel-status-card">
          <div className="matrix-wheel-status-number">{totalWinners}</div>
          <div className="matrix-wheel-status-label">Total Winners</div>
        </div>
      </div>

      <div className="matrix-wheel-stage">
        {isFlipGame ? (
          <div className="live-console__flip-wrap">
            <div className="live-console__slot-machine">
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
              <button
                className={`live-console__spin-arcade${isSpinning ? " is-spinning" : ""}`}
                type="button"
                onClick={() => executeBackendSpin()}
                disabled={isSpinning}
                aria-label="Spin"
                title="Spin"
              >
                <span className="live-console__spin-arcade-label">SPIN</span>
              </button>
            </div>
          </div>
        ) : wheelPrizes.length ? (
          <div className={`matrix-wheel-lib-wrap ${wheelTheme}`} style={{ ["--wheel-segments" as string]: wheelPrizes.length }}>
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
            <WheelOfFortune
              ref={wheelRef}
              className={`matrix-wheel-lib ${wheelDensityClass} ${wheelSamplingClass}`.trim()}
              prizes={wheelPrizes}
              wheelPointer={<div className="matrix-wheel-lib-pointer" />}
              wheelSpinButton={
                <button
                  type="button"
                  className="matrix-wheel-lib-spin"
                  disabled={isSpinning}
                  onClick={() => executeBackendSpin()}
                >
                  SPIN
                </button>
              }
              onSpinStart={() => {
                setIsSpinning(true);
                setShowWinnerPopup(false);
                setWinner(null);
              }}
              onSpinEnd={(prize) => {
                setIsSpinning(false);
                const resolved = backendWinnerRef.current ?? wheelParticipants.find((entry) => entry.id === prize.key) ?? null;
                backendWinnerRef.current = null;
                if (resolved) {
                  setWinner(resolved);
                  setShowWinnerPopup(true);
                }
                if (shouldRefreshRef.current) {
                  shouldRefreshRef.current = false;
                  router.refresh();
                }
              }}
              animationDurationInMs={4500}
              wheelRotationsCount={6}
              wheelBorderColor="#00FF66"
            />
          </div>
        ) : (
          <div className="matrix-empty-wheel">No Participants</div>
        )}
      </div>

      <div className="matrix-wheel-actions">
        <button className="matrix-wheel-cta-primary" type="button">
          <span aria-hidden="true">🚀</span> Join Now
        </button>
        <button className="matrix-wheel-cta-secondary" type="button">
          <span aria-hidden="true">🏆</span> Leaderboard
        </button>
      </div>

      <article className="live-console__mini-note">
        <strong>How to Join</strong>
        <div className="muted">Use your Binance nickname + hold required balance + join live chat before draw.</div>
        {spinError ? <div className="muted" style={{ color: "#ff8f8f" }}>{spinError}</div> : null}
      </article>

      {showWinnerPopup && winner ? (
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
            <h2 className="matrix-winner-name">{winner.username}</h2>
            <p className="matrix-winner-id">
              Exchange ID: <strong>{winner.binanceId}</strong>
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
