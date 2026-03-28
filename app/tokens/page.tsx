import Link from "next/link";
import { MatrixPage } from "@/components/matrix-site";

const tokenItems = [
  {
    id: "tank",
    name: "TINKTANK",
    symbol: "$TANK",
    href: "/tokens/tank",
    description: "Community token mission page",
    logo: "https://matrixclan.com/tank/assets/tinktank-logo.png"
  },
  {
    id: "sui",
    name: "SUI",
    symbol: "$SUI",
    href: "/tokens/sui",
    description: "SUI market and ecosystem page",
    logo: "/tokens/sui-logo.png"
  }
];

export default function TokensPage() {
  return (
    <MatrixPage>
      <section className="matrix-page-head matrix-heroes-head">
        <div className="eyebrow">FUSION MATRIX TOKENS</div>
        <div className="matrix-heroes-title-rule" aria-hidden="true" />
        <h1 className="title-lg">Token Hub</h1>
        <p>Select a token to open its dedicated page.</p>
        <div className="matrix-page-metrics">
          <article>
            <strong>{tokenItems.length}</strong>
            <span>Listed Tokens</span>
          </article>
          <article>
            <strong>2</strong>
            <span>Live Token Pages</span>
          </article>
          <article>
            <strong>24/7</strong>
            <span>Market Tracking</span>
          </article>
        </div>
      </section>

      <section className="matrix-token-grid">
        {tokenItems.map((token) => (
          <article className="matrix-token-card" key={token.id}>
            <img src={token.logo} alt={`${token.name} logo`} className="matrix-token-hub-logo" />
            <h2>{token.name}</h2>
            <div className="matrix-token-label">{token.symbol}</div>
            <p>{token.description}</p>
            <Link href={token.href} className="matrix-pill-btn">
              Open {token.symbol}
            </Link>
          </article>
        ))}
      </section>
    </MatrixPage>
  );
}
