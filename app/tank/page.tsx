import { MatrixPage } from "@/components/matrix-site";

export default function TankPage() {
  const walletItems = [
    { id: "binance", title: "Binance Wallet", subtitle: "Official BSC wallet" },
    { id: "trust", title: "Trust Wallet", subtitle: "Secure mobile wallet" },
    { id: "metamask", title: "MetaMask", subtitle: "Popular browser wallet" },
    { id: "safepal", title: "SafePal", subtitle: "Hardware & software wallet" }
  ];

  return (
    <MatrixPage>
      <div className="matrix-tank-shell matrix-tank-page">
        <section className="matrix-tank-burn-strip">
          <span className="matrix-tank-fire-icon">🔥</span>
          <p>BURNTANK IS COMING: 18% SUPPLY BURN AT 100% BONDING CURVE</p>
          <a href="#" className="matrix-tank-plan-btn">View BurnTank Plan</a>
        </section>

        <section className="matrix-tank-hero">
          <div className="matrix-tank-hero-logo-wrap">
            <div className="matrix-tank-hero-logo-ring" />
            <img src="https://matrixclan.com/tank/assets/tinktank-logo.png" alt="TinkTank Logo" className="matrix-tank-hero-logo" />
          </div>
          <h1 className="matrix-tank-title">TINKTANK</h1>
          <h2 className="matrix-tank-symbol">$TANK</h2>
          <p className="matrix-tank-tagline">Unleashing Fairy Power on the Blockchain</p>
          <p className="matrix-tank-subline">Community-Driven by FUSION MATRIX</p>
          <div className="matrix-tank-cta-row">
            <a href="#" className="matrix-tank-cta-primary"><i className="fas fa-cart-shopping" /> Buy Now on four.meme</a>
            <a href="#" className="matrix-tank-cta-secondary"><i className="fas fa-share-nodes" /> Share $TANK</a>
          </div>
        </section>

        <section className="matrix-tank-burn-metrics">
          <article className="matrix-tank-burn-card">
            <div className="matrix-tank-burn-label">Total Tokens Burnt</div>
            <div className="matrix-tank-burn-value">0 TANK</div>
            <div className="matrix-tank-burn-foot">
              Verify on BscScan <i className="fas fa-external-link-alt" />
            </div>
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
            <div className="matrix-tank-mini-icon">🌐</div>
            <div className="matrix-tank-mini-label">Network</div>
            <div className="matrix-tank-mini-value">BSC</div>
          </article>
          <article className="matrix-tank-mini-card">
            <div className="matrix-tank-mini-icon">📈</div>
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
          <a href="#" className="matrix-tank-contract-link">
            View on BscScan <i className="fas fa-external-link-alt" />
          </a>
        </section>

        <section className="matrix-tank-story">
          <article className="matrix-tank-info-card matrix-tank-info-single">
            <h2>About TinkTank</h2>
            <p>
              TinkTank ($TANK) is where the sass and magic of Tinkerbell meets the unstoppable force of a battle-ready tank, all wrapped in that iconic Matrix green glow. This is a movement by FUSION MATRIX to build wealth for our community through the power of memes and blockchain technology.
            </p>
          </article>
          <article className="matrix-tank-info-card matrix-tank-info-single">
            <h2>Our Vision</h2>
            <p>
              FUSION MATRIX is committed to building wealth for our community. Through TinkTank, we are creating opportunities for everyone to participate in the exciting world of cryptocurrency and meme tokens. Together, we grow stronger, and together, we succeed.
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
              <a href="#">Buy on four.meme <i className="fas fa-arrow-right" /></a>
            </article>
            <article className="matrix-tank-step-card">
              <div className="matrix-tank-step-num">2</div>
              <h3>Buy on PancakeSwap (After 18 BNB Bonding Curve)</h3>
              <p>Once the bonding curve completes, $TANK will be available on PancakeSwap for trading.</p>
              <a href="#">Buy on PancakeSwap (Coming Soon) <i className="fas fa-lock" /></a>
            </article>
          </div>
        </section>

        <section className="matrix-tank-wallets">
          <h2>Compatible Wallets</h2>
          <div className="matrix-tank-wallet-grid">
            {walletItems.map((wallet) => (
              <article className="matrix-tank-wallet-card" key={wallet.id}>
                {wallet.id === "binance" ? (
                  <svg className="wallet-logo-svg wallet-logo-binance" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z" />
                  </svg>
                ) : wallet.id === "trust" ? (
                  <svg className="wallet-logo-svg wallet-logo-trust" viewBox="0 0 39 43" aria-hidden="true">
                    <path d="M0.882812 6.36743L19.6037 0.300415V42.3004C6.23144 36.6999 0.882812 25.9667 0.882812 19.9009V6.36743Z" fill="#0500FF" />
                    <path d="M38.3263 6.36743L19.6055 0.300415V42.3004C32.9777 36.6999 38.3263 25.9667 38.3263 19.9009V6.36743Z" fill="url(#trustGradient)" />
                    <defs>
                      <linearGradient id="trustGradient" x1="33.3535" y1="-2.6407" x2="19.2876" y2="41.7504" gradientUnits="userSpaceOnUse">
                        <stop offset="0.02" stopColor="#0000FF" />
                        <stop offset="0.08" stopColor="#0094FF" />
                        <stop offset="0.16" stopColor="#48FF91" />
                        <stop offset="0.42" stopColor="#0094FF" />
                        <stop offset="0.68" stopColor="#0038FF" />
                        <stop offset="0.9" stopColor="#0500FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                ) : wallet.id === "metamask" ? (
                  <svg className="metamask-icon" viewBox="0 0 318.6 318.6" width="48" height="48" aria-hidden="true">
                    <path fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" d="m274.1 35.5-99.5 73.9L193 65.8z" />
                    <path fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z" />
                    <path fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z" />
                    <path fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z" />
                    <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z" />
                    <path fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z" />
                    <path fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z" />
                    <path fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z" />
                    <path fill="#c0ad9e" stroke="#c0ad9e" strokeLinecap="round" strokeLinejoin="round" d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z" />
                    <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z" />
                    <path fill="#763d16" stroke="#763d16" strokeLinecap="round" strokeLinejoin="round" d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z" />
                    <path fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z" />
                  </svg>
                ) : (
                  <svg className="wallet-logo-svg wallet-logo-safepal" viewBox="0 0 40 40" aria-hidden="true">
                    <path d="M17.5359 0C16.3185 -1.12678e-07 15.1509 0.483616 14.2901 1.34446L0.768219 14.8666C0.256067 15.3788 -4.19303e-06 16.05 0 16.7213C4.19313e-06 17.3926 0.256084 18.0638 0.768233 18.576L9.62954 27.4373V11.7495C9.62954 10.5788 10.5712 9.6297 11.7419 9.6297C16.6881 9.6297 28.7279 9.6297 30.3701 9.6297L39.9996 0.000136473L17.5359 0Z" fill="#4A21EF" />
                    <path d="M9.62979 30.3703H28.2505C29.4213 30.3703 30.3703 29.4212 30.3703 28.2505V12.5626L39.2317 21.424C39.7438 21.9362 39.9999 22.6074 39.9999 23.2787C39.9999 23.95 39.7438 24.6212 39.2317 25.1334L25.7098 38.6555C24.849 39.5164 23.6814 40 22.464 40L0.000244141 39.9999L9.62979 30.3703Z" fill="#4A21EF" />
                  </svg>
                )}
                <h3>{wallet.title}</h3>
                <p>{wallet.subtitle}</p>
              </article>
            ))}
          </div>
          <p className="matrix-tank-wallet-note">Make sure to add BSC network to your wallet before purchasing $TANK</p>
        </section>
      </div>

      <a href="#" className="matrix-tank-sticky-plan-btn">
        <i className="fas fa-fire" />
        <span>View BurnTank Plan</span>
      </a>
    </MatrixPage>
  );
}
