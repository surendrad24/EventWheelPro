"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AdminCompetitionSwitcher } from "@/components/admin-competition-switcher";

type CompetitionOption = {
  id: string;
  title: string;
};

export function LiveControlFrame({
  competitionId,
  competitionOptions,
  children
}: {
  competitionId: string;
  competitionOptions: CompetitionOption[];
  children: ReactNode;
}) {
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabFocus, setIsTabFocus] = useState(false);

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
