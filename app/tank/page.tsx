import { MatrixPage } from "@/components/matrix-site";

export default function TankPage() {
  const walletItems = [
    ["fab fa-bitcoin", "Binance Wallet", "Official BSC wallet"],
    ["fas fa-shield-halved", "Trust Wallet", "Secure mobile wallet"],
    ["fas fa-fox", "MetaMask", "Popular browser wallet"],
    ["fas fa-wallet", "SafePal", "Hardware & software wallet"]
  ];

  return (
    <MatrixPage>
      <div className="matrix-tank-shell">
        <section className="matrix-tank-burn-strip">
          <span>🔥</span>
          <p>BURNTANK IS COMING: 18% SUPPLY BURN AT 100% BONDING CURVE</p>
          <a href="#" className="matrix-tank-plan-btn">View BurnTank Plan</a>
        </section>

        <section className="matrix-tank-hero">
          <div className="matrix-tank-hero-logo-wrap">
            <div className="matrix-tank-hero-logo-ring" />
            <img src="https://matrixclan.com/assets/tinktank-logo.png" alt="TinkTank Logo" className="matrix-tank-hero-logo" />
          </div>
          <h1 className="matrix-tank-title">TINKTANK</h1>
          <h2 className="matrix-tank-symbol">$TANK</h2>
          <p className="matrix-tank-tagline">Unleashing Fairy Power on the Blockchain</p>
          <p className="matrix-tank-subline">Community-Driven by TEAM MATRIX</p>
          <div className="matrix-tank-cta-row">
            <a href="#" className="matrix-tank-cta-primary"><i className="fas fa-cart-shopping" /> Buy Now on four.meme</a>
            <a href="#" className="matrix-tank-cta-secondary"><i className="fas fa-share-nodes" /> Share $TANK</a>
          </div>
          <a href="#" className="matrix-tank-floating-plan">View BurnTank Plan</a>
        </section>

        <section className="matrix-tank-burn-metrics">
          <article className="matrix-tank-burn-card">
            <div className="matrix-tank-burn-label">Total Tokens Burnt</div>
            <div className="matrix-tank-burn-value">0 TANK</div>
            <div className="matrix-tank-burn-foot">Verify on BscScan</div>
          </article>
          <article className="matrix-tank-burn-card">
            <div className="matrix-tank-burn-label">Treasury Balance</div>
            <div className="matrix-tank-burn-value">22,05,81,644 TANK</div>
            <div className="matrix-tank-burn-foot">Private / Vesting Wallet</div>
          </article>
        </section>

        <section className="matrix-tank-market">
          <h2>Live Market Data</h2>
          <p className="matrix-tank-section-sub">Real-time statistics from the blockchain</p>
          <div className="matrix-tank-market-grid">
            <article className="matrix-tank-chart-card">
              <div className="matrix-tank-chart-placeholder">
                <span>loading pair...</span>
              </div>
              <div className="matrix-tank-chart-foot">powered by DEXSCREENER</div>
            </article>
            <div className="matrix-tank-market-right">
              {["Current Price", "Market Cap", "Liquidity", "24H Volume"].map((label) => (
                <article className="matrix-tank-live-stat" key={label}>
                  <div className="matrix-tank-live-label">{label}</div>
                  <div className="matrix-tank-live-value">Loading...</div>
                </article>
              ))}
              <a href="#" className="matrix-tank-trade-btn"><i className="fas fa-bolt" /> Trade on Four.meme</a>
            </div>
          </div>
        </section>

        <section className="matrix-tank-micro-stats">
          <article className="matrix-tank-mini-card">
            <div className="matrix-tank-mini-icon">💎</div>
            <div className="matrix-tank-mini-label">Total Supply</div>
            <div className="matrix-tank-mini-value">1,000,000,000</div>
          </article>
          <article className="matrix-tank-mini-card">
            <div className="matrix-tank-mini-icon"><i className="fas fa-globe" /></div>
            <div className="matrix-tank-mini-label">Network</div>
            <div className="matrix-tank-mini-value">BSC</div>
          </article>
          <article className="matrix-tank-mini-card">
            <div className="matrix-tank-mini-icon"><i className="fas fa-chart-line" /></div>
            <div className="matrix-tank-mini-label">Bonding Curve</div>
            <div className="matrix-tank-mini-value">18 BNB</div>
          </article>
        </section>

        <section className="matrix-tank-contract">
          <h2>Contract Address</h2>
          <div className="matrix-tank-contract-pill">
            0x1507e5361d2369f7ac0677d942941d0d2360c344
            <button type="button" aria-label="Copy contract"><i className="fas fa-copy" /></button>
          </div>
          <a href="#" className="matrix-tank-contract-link">View on BscScan</a>
        </section>

        <section className="matrix-tank-story">
          <article className="matrix-tank-info-card matrix-tank-info-single">
            <h2>About TinkTank</h2>
            <p>
              TinkTank ($TANK) is where the sass and magic of Tinkerbell meets the unstoppable force of a battle-ready tank, all wrapped in that iconic Matrix green glow. This is a movement by TEAM MATRIX to build wealth for our community through the power of memes and blockchain technology.
            </p>
          </article>
          <article className="matrix-tank-info-card matrix-tank-info-single">
            <h2>Our Vision</h2>
            <p>
              TEAM MATRIX is committed to building wealth for our community. Through TinkTank, we are creating opportunities for everyone to participate in the exciting world of cryptocurrency and meme tokens. Together, we grow stronger, and together, we succeed.
            </p>
          </article>
        </section>

        <section className="matrix-tank-how-buy">
          <h2>How to Buy</h2>
          <div className="matrix-tank-how-grid">
            <article className="matrix-tank-step-card">
              <div className="matrix-tank-step-num">1</div>
              <h3>Buy on four.meme (Before Bonding Curve)</h3>
              <p>Get in early! Buy $TANK on four.meme before the bonding curve completes at 18 BNB.</p>
              <a href="#">Buy on four.meme →</a>
            </article>
            <article className="matrix-tank-step-card">
              <div className="matrix-tank-step-num">2</div>
              <h3>Buy on PancakeSwap (After 18 BNB Bonding Curve)</h3>
              <p>Once the bonding curve completes, $TANK will be available on PancakeSwap for trading.</p>
              <a href="#">Buy on PancakeSwap (Coming Soon) 🔒</a>
            </article>
          </div>
        </section>

        <section className="matrix-tank-wallets">
          <h2>Compatible Wallets</h2>
          <div className="matrix-tank-wallet-grid">
            {walletItems.map(([icon, title, subtitle]) => (
              <article className="matrix-tank-wallet-card" key={title}>
                <i className={icon} />
                <h3>{title}</h3>
                <p>{subtitle}</p>
              </article>
            ))}
          </div>
          <p className="matrix-tank-wallet-note">Make sure to add BSC network to your wallet before purchasing $TANK</p>
        </section>
      </div>
    </MatrixPage>
  );
}
