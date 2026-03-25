import { ReactNode } from "react";
import { MatrixRainBackground } from "@/components/matrix-rain-background";
import { MatrixHeader } from "@/components/matrix-header";
import { store } from "@/lib/server/in-memory-store";

export function MatrixFooter() {
  return (
    <footer className="matrix-footer">
      <div className="shell">
        © 2026 <a href="https://fusionlancers.com/" target="_blank" rel="noreferrer">FUSIONLANCERS TECHNOLOGIES</a>.  All Rights Reserved. | Version 0.1.0
      </div>
    </footer>
  );
}

export function MatrixPage({
  children,
  fullWidth = false
}: {
  children: ReactNode;
  fullWidth?: boolean;
}) {
  const competitions = store.listCompetitions().map((competition) => ({
    id: competition.id,
    slug: competition.slug,
    title: competition.title,
    themeKey: competition.themeKey,
    status: competition.status
  }));

  return (
    <>
      <MatrixRainBackground />
      <MatrixHeader competitions={competitions} />
      <main className={`matrix-page ${fullWidth ? "" : "shell"}`.trim()}>{children}</main>
      <MatrixFooter />
    </>
  );
}
