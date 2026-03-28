"use client";

import { useEffect, useMemo, useState } from "react";

type MarketState = {
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  chartUrl: string | null;
  tradeUrl: string;
  source: "Dexscreener" | "Binance" | "Unavailable";
};

const BINANCE_TRADE_URL = "https://www.binance.com/en/trade/SUI_USDT";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatPrice(value: number | null): string {
  if (value === null) {
    return "Loading...";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2
  }).format(value);
}

function formatCompactUsd(value: number | null): string {
  if (value === null) {
    return "Loading...";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

function buildDexEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("embed", "1");
    parsed.searchParams.set("theme", "dark");
    parsed.searchParams.set("trades", "0");
    parsed.searchParams.set("info", "0");
    return parsed.toString();
  } catch {
    return null;
  }
}

async function fetchDexscreenerSui(): Promise<MarketState | null> {
  const response = await fetch("https://api.dexscreener.com/latest/dex/search/?q=SUI", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    pairs?: Array<{
      baseToken?: { symbol?: string };
      quoteToken?: { symbol?: string };
      priceUsd?: string | number;
      marketCap?: string | number;
      fdv?: string | number;
      liquidity?: { usd?: string | number };
      volume?: { h24?: string | number };
      url?: string;
    }>;
  };

  const candidate = (payload.pairs ?? [])
    .filter((pair) => pair.baseToken?.symbol === "SUI" || pair.quoteToken?.symbol === "SUI")
    .sort((a, b) => (toFiniteNumber(b.volume?.h24) ?? 0) - (toFiniteNumber(a.volume?.h24) ?? 0))[0];

  if (!candidate?.url) {
    return null;
  }

  return {
    priceUsd: toFiniteNumber(candidate.priceUsd),
    marketCapUsd: toFiniteNumber(candidate.marketCap) ?? toFiniteNumber(candidate.fdv),
    liquidityUsd: toFiniteNumber(candidate.liquidity?.usd),
    volume24hUsd: toFiniteNumber(candidate.volume?.h24),
    chartUrl: buildDexEmbedUrl(candidate.url),
    tradeUrl: candidate.url,
    source: "Dexscreener"
  };
}

async function fetchBinanceSui(): Promise<MarketState | null> {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SUIUSDT", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    lastPrice?: string;
    quoteVolume?: string;
  };

  return {
    priceUsd: toFiniteNumber(payload.lastPrice),
    marketCapUsd: null,
    liquidityUsd: null,
    volume24hUsd: toFiniteNumber(payload.quoteVolume),
    chartUrl: null,
    tradeUrl: BINANCE_TRADE_URL,
    source: "Binance"
  };
}

export function SuiMarketSection() {
  const [market, setMarket] = useState<MarketState>({
    priceUsd: null,
    marketCapUsd: null,
    liquidityUsd: null,
    volume24hUsd: null,
    chartUrl: null,
    tradeUrl: BINANCE_TRADE_URL,
    source: "Unavailable"
  });

  useEffect(() => {
    let cancelled = false;

    const loadMarket = async () => {
      const dex = await fetchDexscreenerSui();
      if (!cancelled && dex) {
        setMarket(dex);
        return;
      }

      const binance = await fetchBinanceSui();
      if (!cancelled && binance) {
        setMarket(binance);
      }
    };

    void loadMarket();
    const timer = window.setInterval(() => {
      void loadMarket();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const statItems = useMemo(
    () => [
      { label: "Current Price", value: formatPrice(market.priceUsd) },
      { label: "Market Cap", value: formatCompactUsd(market.marketCapUsd) },
      { label: "Liquidity", value: formatCompactUsd(market.liquidityUsd) },
      { label: "24H Volume", value: formatCompactUsd(market.volume24hUsd) }
    ],
    [market]
  );

  return (
    <section className="matrix-tank-market matrix-sui-market">
      <h2>Live Market Data</h2>
      <p className="matrix-tank-section-sub">
        Real-time statistics from {market.source === "Unavailable" ? "market APIs" : market.source}
      </p>
      <div className="matrix-sui-market-stack">
        <article className="matrix-tank-chart-card">
          {market.chartUrl ? (
            <iframe
              className="matrix-tank-chart-embed"
              src={market.chartUrl}
              title="SUI chart"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="matrix-tank-chart-placeholder">
              <span>Chart unavailable. Falling back to Binance ticker.</span>
            </div>
          )}
          <div className="matrix-tank-chart-foot">powered by DEXSCREENER / BINANCE</div>
        </article>
        <div className="matrix-sui-market-stats">
          {statItems.map((item) => (
            <article className="matrix-tank-live-stat" key={item.label}>
              <div className="matrix-tank-live-label">{item.label}</div>
              <div className="matrix-tank-live-value">{item.value}</div>
            </article>
          ))}
        </div>
        <a href={market.tradeUrl} className="matrix-tank-trade-btn matrix-sui-trade-btn" target="_blank" rel="noreferrer">
          <i className="fas fa-bolt" /> {market.source === "Binance" ? "Trade on Binance" : "Trade on Sui DEX"}
        </a>
      </div>
    </section>
  );
}
