import { ReactNode } from "react";
import { MatrixRainBackground } from "@/components/matrix-rain-background";

export function MatrixFooter() {
  return (
    <footer className="matrix-footer">
      <div className="shell">
        <p>
          © 2026 <a href="https://fusionlancers.com/" target="_blank" rel="noopener noreferrer">FUSIONLANCERS TECHNOLOGIES</a>. All Rights Reserved. | Version 0.1.0
        </p>
        <div className="social-icons" aria-label="Social links">
          <a className="social-icon" href="https://x.com/keanuleafes" target="_blank" rel="noopener noreferrer" aria-label="Follow on X">
            <i className="fa-brands fa-x-twitter" />
          </a>
          <a className="social-icon" href="https://t.me/CryptoMatrixTeam" target="_blank" rel="noopener noreferrer" aria-label="Join Telegram">
            <i className="fa-brands fa-telegram" />
          </a>
          <a className="social-icon" href="https://instagram.com/keanuleafes" target="_blank" rel="noopener noreferrer" aria-label="Follow on Instagram">
            <i className="fa-brands fa-instagram" />
          </a>
          <a className="social-icon" href="https://youtube.com/@binancematrixclan" target="_blank" rel="noopener noreferrer" aria-label="Watch on YouTube">
            <i className="fa-brands fa-youtube" />
          </a>
          <a className="social-icon" href="https://www.linkedin.com/company/fusionlancers-technologies/" target="_blank" rel="noopener noreferrer" aria-label="Connect on LinkedIn">
            <i className="fa-brands fa-linkedin" />
          </a>
          <a className="social-icon" href="https://www.facebook.com/fusionlancers" target="_blank" rel="noopener noreferrer" aria-label="Follow on Facebook">
            <i className="fa-brands fa-facebook" />
          </a>
        </div>
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
  return (
    <>
      <MatrixRainBackground />
      <main className={`matrix-page ${fullWidth ? "" : "shell"}`.trim()}>{children}</main>
    </>
  );
}
