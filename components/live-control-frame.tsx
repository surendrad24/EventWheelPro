"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AdminCompetitionSwitcher } from "@/components/admin-competition-switcher";
import type { CompetitionGameType } from "@/lib/types";

type CompetitionOption = {
  id: string;
  title: string;
};

export function LiveControlFrame({
  competitionId,
  gameType,
  competitionOptions,
  children
}: {
  competitionId: string;
  gameType: CompetitionGameType;
  competitionOptions: CompetitionOption[];
  children: ReactNode;
}) {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocus, setIsTabFocus] = useState(false);
  const [quizQuickStatus, setQuizQuickStatus] = useState<"stopped" | "running" | "paused">("stopped");
  const [quizQuickLoading, setQuizQuickLoading] = useState(false);
  const isQuizGame = gameType === "quiz";

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("live-console-tab-focus-open", isTabFocus);
    return () => document.body.classList.remove("live-console-tab-focus-open");
  }, [isTabFocus]);

  async function toggleFullscreen() {
    const el = fullscreenRef.current;
    if (!el) return;

    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else if (!document.fullscreenElement) {
        await el.requestFullscreen();
      }
    } catch {
      // no-op fallback: keep UI stable if browser blocks fullscreen.
    }
  }

  function toggleTabFocus() {
    setIsTabFocus((prev) => !prev);
  }

  useEffect(() => {
    if (!isQuizGame) {
      return;
    }
    let active = true;
    const loadQuizStatus = async () => {
      const response = await fetch(`/api/admin/competitions/${competitionId}/quiz-live`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!active || !response.ok) {
        return;
      }
      setQuizQuickStatus((body.liveState?.status ?? "stopped") as "stopped" | "running" | "paused");
    };

    void loadQuizStatus();
    const intervalId = window.setInterval(() => {
      void loadQuizStatus();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [competitionId, isQuizGame]);

  async function toggleQuizQuick() {
    if (!isQuizGame || quizQuickLoading) {
      return;
    }
    setQuizQuickLoading(true);
    const action = quizQuickStatus === "running"
      ? "pause"
      : quizQuickStatus === "paused"
        ? "resume"
        : "start";
    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/quiz-live`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        setQuizQuickStatus((body.liveState?.status ?? "stopped") as "stopped" | "running" | "paused");
      }
    } finally {
      setQuizQuickLoading(false);
    }
  }

  return (
    <>
      <div className="live-console__below-nav">
        <div className="live-console__nav">
          <div className="live-console__nav-brand">FUSION MATRIX</div>
          <div className="live-console__nav-center">
            <AdminCompetitionSwitcher
              value={competitionId}
              options={competitionOptions}
              routeSuffix="live-control"
              label="Competition"
            />
          </div>
          {isQuizGame && (
            <button
              type="button"
              className="live-console__tab-focus-btn"
              onClick={toggleQuizQuick}
              disabled={quizQuickLoading}
              aria-label="Toggle quiz live"
              title="Toggle quiz live"
            >
              {quizQuickStatus === "running" ? "PAUSE QUIZ" : quizQuickStatus === "paused" ? "RESUME QUIZ" : "GO LIVE QUIZ"}
            </button>
          )}
          <button
            type="button"
            className="live-console__tab-focus-btn"
            onClick={toggleTabFocus}
            aria-label={isTabFocus ? "Exit tab focus mode" : "Enter tab focus mode"}
            title={isTabFocus ? "Exit tab focus mode" : "Enter tab focus mode"}
          >
            {isTabFocus ? "▣" : "▢"}
          </button>
          <button
            type="button"
            className="live-console__fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
        </div>
      </div>

      <div
        ref={fullscreenRef}
        className={`live-console__fullscreen-target${isTabFocus ? " live-console__fullscreen-target--tab" : ""}`}
      >
        {isTabFocus && (
          <button
            type="button"
            className="live-console__fullscreen-exit live-console__fullscreen-exit--tab"
            onClick={toggleTabFocus}
            aria-label="Exit tab focus mode"
            title="Exit tab focus mode"
          >
            ✕
          </button>
        )}
        {isFullscreen && (
          <button
            type="button"
            className="live-console__fullscreen-exit"
            onClick={toggleFullscreen}
            aria-label="Exit fullscreen"
            title="Exit fullscreen"
          >
            ✕
          </button>
        )}
        {children}
      </div>
    </>
  );
}
