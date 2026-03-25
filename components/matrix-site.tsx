import { ReactNode } from "react";
import { MatrixRainBackground } from "@/components/matrix-rain-background";
import { MatrixHeader } from "@/components/matrix-header";

export function MatrixFooter() {
  return (
    <footer className="matrix-footer">
      <div className="shell">© 2026 TEAM MATRIX. All Rights Reserved. | Version 12.7.28</div>
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
  return (
    <>
      <MatrixRainBackground />
      <MatrixHeader />
      <main className={`matrix-page ${fullWidth ? "" : "shell"}`.trim()}>{children}</main>
      <MatrixFooter />
    </>
  );
}
