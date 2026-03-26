import { MatrixPage } from "@/components/matrix-site";

export default function ProfilePage() {
  return (
    <MatrixPage>
      <section className="matrix-page-head matrix-profile-head">
        <div className="eyebrow">FUSION MATRIX PROFILE</div>
        <div className="matrix-profile-title-rule" aria-hidden="true" />
        <h1 className="title-lg">Create Your Matrix Profile Image</h1>
        <p>Build a branded avatar with the Matrix frame so your profile stands out across Telegram, X, and Binance communities.</p>
        <div className="matrix-page-metrics">
          <article>
            <strong>1:1</strong>
            <span>Square Output</span>
          </article>
          <article>
            <strong>HD</strong>
            <span>Profile Quality</span>
          </article>
          <article>
            <strong>LIVE</strong>
            <span>Instant Preview</span>
          </article>
        </div>
      </section>

      <section className="matrix-profile-editor-grid">
        <article className="matrix-profile-guide">
          <h2>How to Use</h2>
          <ol>
            <li>Upload your portrait image.</li>
            <li>Adjust position and zoom to fit the circular crop area.</li>
            <li>Choose glow intensity and rain background.</li>
            <li>Generate and download your Matrix profile image.</li>
          </ol>
          <div className="matrix-profile-guide-note">
            Pro tip: Square images with centered faces give the best result.
          </div>
        </article>

        <article className="matrix-profile-preview-card">
          <div className="matrix-profile-preview">
            <div className="matrix-profile-circle">
              <span>Preview</span>
            </div>
            <div className="matrix-profile-actions">
              <button className="matrix-pill-btn">Upload Image</button>
              <button className="matrix-pill-btn">Generate Matrix Profile</button>
            </div>
          </div>

          <div className="matrix-profile-controls">
            <label>
              <span>Zoom</span>
              <input type="range" min="50" max="150" defaultValue="100" />
            </label>
            <label>
              <span>Glow Intensity</span>
              <input type="range" min="0" max="100" defaultValue="70" />
            </label>
            <label>
              <span>Rain Density</span>
              <input type="range" min="0" max="100" defaultValue="60" />
            </label>
          </div>
        </article>
      </section>

      <section className="matrix-profile-prompt-wrap">
        <div className="matrix-profile-prompt">
          Upload your portrait, tune the glow, and generate your Matrix-ready profile image.
        </div>
      </section>
    </MatrixPage>
  );
}
