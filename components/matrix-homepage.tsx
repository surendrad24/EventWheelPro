"use client";

import Script from "next/script";
import { useEffect } from "react";
import { MatrixRainBackground } from "@/components/matrix-rain-background";

declare global {
  interface Window {
    Swiper?: new (selector: string, options: Record<string, unknown>) => {
      destroy?: () => void;
    };
    __matrixSwiper?: { destroy?: () => void };
  }
}

type Slide = {
  name: string;
  role: string;
  token: string;
  image: string;
};

type Character = {
  id: string;
  name: string;
  role: string;
  token: string;
  image: string;
  summary: string;
  color: string;
  reverse?: boolean;
};

const slides: Slide[] = [
  { name: "AlondraCrypto", role: "The Pink Guardian", token: "$BNB (Binance)", image: "https://matrixclan.com/assets/images/characters/optimized/alondracrypto_slider_1920.png" },
  { name: "Elex-Rocks", role: "The Cyborg Analyst", token: "$ETH (Ethereum)", image: "https://matrixclan.com/assets/images/characters/optimized/elexrocks_slider_1920.png" },
  { name: "KeanuLeafes", role: "The Matrix Navigator", token: "$DOGE (Dogecoin)", image: "https://matrixclan.com/assets/images/characters/optimized/keanuleafes_slider_1920.png" },
  { name: "PrincePistolero", role: "The Arcane Archer", token: "$SOL (Solana)", image: "https://matrixclan.com/assets/images/characters/optimized/princepistolero_slider_1920.png" },
  { name: "Earnpii", role: "The Quantum Miner", token: "$PI (Pi Network)", image: "https://matrixclan.com/assets/images/characters/optimized/earnpii_slider_1920.png" },
  { name: "MMH", role: "The Market Strategist", token: "$BTC (Bitcoin)", image: "https://matrixclan.com/assets/images/characters/optimized/mmh_slider_1920.png" },
  { name: "Yahia", role: "The Matrix Oracle", token: "$XRP (Ripple)", image: "https://matrixclan.com/assets/images/characters/optimized/yahia_slider_1920.png" },
  { name: "DibiMed", role: "The Crystal Guardian", token: "$SUI (Sui)", image: "https://matrixclan.com/assets/images/characters/optimized/dibimed_slider_1920.png" },
  { name: "OVMARS", role: "The Stacks Guardian", token: "$STX (Stacks)", image: "https://matrixclan.com/assets/images/characters/optimized/ovmars_slider_1920.png" }
];

const characters: Character[] = [
  {
    id: "alondracrypto",
    name: "AlondraCrypto",
    role: "The Pink Guardian",
    token: "$BNB (Binance)",
    image: "https://matrixclan.com/assets/images/characters/portraits/alondracrypto_portrait.jpg",
    summary:
      "A fearless heroine with glowing pink hair and the Binance logo on her armor. Her abilities allow her to stabilize decentralized networks and protect them from attacks....",
    color: "#F3BA2F"
  },
  {
    id: "elexrocks",
    name: "Elex-Rocks",
    role: "The Cyborg Analyst",
    token: "$ETH (Ethereum)",
    image: "https://matrixclan.com/assets/images/characters/portraits/1000000307.jpg",
    summary:
      "A cybernetic warrior who analyzes data streams in real time and predicts market movements. His mechanical implants are synchronized with the Ethereum blockchain....",
    color: "#727DF5",
    reverse: true
  },
  {
    id: "keanuleafes",
    name: "KeanuLeafes",
    role: "The Matrix Navigator",
    token: "$DOGE (Dogecoin)",
    image: "https://matrixclan.com/assets/images/characters/portraits/keanuleafes_new.jpg",
    summary:
      "An agile fighter who navigates through the digital Matrix, channeling meme energy to confuse and overwhelm his opponents....",
    color: "#BA9F33"
  },
  {
    id: "princepistolero",
    name: "PrincePistolero",
    role: "The Arcane Archer",
    token: "$SOL (Solana)",
    image: "https://matrixclan.com/assets/images/characters/portraits/princepistolero_new.jpg",
    summary:
      "A precise marksman whose magical arrows are linked to the Solana blockchain, making them lightning-fast and unstoppable....",
    color: "#9370db",
    reverse: true
  },
  {
    id: "earnpii",
    name: "Earnpii",
    role: "The Quantum Miner",
    token: "$PI (Pi Network)",
    image: "https://matrixclan.com/assets/images/characters/portraits/1000000301.jpg",
    summary:
      "A time traveler who predicts future market trends and generates energy for the team by mining PI tokens....",
    color: "#9932cc"
  },
  {
    id: "mmh",
    name: "MMH",
    role: "The Market Strategist",
    token: "$BTC (Bitcoin)",
    image: "https://matrixclan.com/assets/images/characters/portraits/1000000303.jpg",
    summary:
      "A tactical thinker who uses the stability of Bitcoin to plan and coordinate the team's strategies....",
    color: "#F7931A",
    reverse: true
  },
  {
    id: "yahia",
    name: "Yahia",
    role: "The Matrix Oracle",
    token: "$XRP (Ripple)",
    image: "https://matrixclan.com/assets/images/characters/portraits/yahia_portrait.jpg",
    summary: "Yahia is the XRP getaway driver....",
    color: "#23292F"
  },
  {
    id: "dibimed",
    name: "DibiMed",
    role: "The Crystal Guardian",
    token: "$SUI (Sui)",
    image: "https://matrixclan.com/assets/images/characters/portraits/dibimed_portrait.jpg",
    summary:
      "DibiMed is the crystal ice guardian who controls the frozen blockchain networks with his SUI powers....",
    color: "#4DA6FF",
    reverse: true
  },
  {
    id: "ovmars",
    name: "OVMARS",
    role: "The Stacks Guardian",
    token: "$STX (Stacks)",
    image: "https://matrixclan.com/assets/images/characters/portraits/ovmars_portrait_rectangular.png",
    summary:
      "OVMARS is the mysterious Stacks Guardian, wielding purple energy and STX blockchain powers. His black armor and mask conceal his identity while he protects the decentralized web....",
    color: "#5546FF"
  }
];

export function MatrixHomepage() {
  useEffect(() => {
    const initSwiper = () => {
      if (!window.Swiper || window.__matrixSwiper) {
        return;
      }
      window.__matrixSwiper = new window.Swiper(".swiper", {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false
        },
        pagination: {
          el: ".swiper-pagination",
          clickable: true
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev"
        }
      });
    };

    initSwiper();
    const interval = window.setInterval(initSwiper, 300);

    return () => {
      window.clearInterval(interval);
      window.__matrixSwiper?.destroy?.();
      window.__matrixSwiper = undefined;
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/matrix-rain.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/style.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      <div className="matrix-mirror-root">
        <MatrixRainBackground />

        <section className="hero-slider">
          <div className="swiper">
            <div className="swiper-wrapper">
              {slides.map((slide) => (
                <div className="swiper-slide" key={slide.name}>
                  <img src={slide.image} alt={slide.name} />
                  <div className="slide-content">
                    <h2 className="matrix-gradient-text matrix-font">{slide.name}</h2>
                    <p>{slide.role} | {slide.token}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="swiper-button-next" />
            <div className="swiper-button-prev" />
            <div className="swiper-pagination" />
          </div>
        </section>

        <section id="characters" className="characters-section">
          <div className="container">
            <h2 className="section-title matrix-gradient-text matrix-font">
              MEET THE DEFENDERS OF ASSETS
              <span className="section-title-line" aria-hidden="true">
                <span className="section-title-line-glow" />
              </span>
            </h2>
            {characters.map((hero) => (
              <div className="row character-row mb-4" key={hero.id}>
                <div className="col-12">
                  <div className="character-card matrix-animated-border" style={{ ["--matrix-green-bright" as string]: hero.color }}>
                    <div className={`row ${hero.reverse ? "flex-row-reverse" : ""}`}>
                      <div className="col-md-3 character-image">
                        <img src={hero.image} alt={hero.name} style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: "3%" }} />
                      </div>
                      <div className="col-md-9 character-info">
                        <h3 className="matrix-gradient-text matrix-font">{hero.name}</h3>
                        <p className="role">{hero.role}</p>
                        <p className="token">Token Power: {hero.token}</p>
                        <p>{hero.summary}</p>
                        <a href={`/heroes?hero=${hero.id}`} className="btn btn-matrix">LEARN MORE</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <div className="container">
            <div className="row">
              <div className="col-12">
                <p>© 2026 <a href="https://fusionlancers.com/" target="_blank" rel="noreferrer">FUSIONLANCERS TECHNOLOGIES</a>.  All Rights Reserved. | Version 0.1.0</p>
                <div className="social-icons d-flex justify-content-center mt-3">
                  <a href="#" target="_blank" rel="noreferrer"><i className="fab fa-square-x-twitter" /></a>
                  <a href="https://t.me/CryptoMatrixTeam" target="_blank" rel="noreferrer"><i className="fab fa-telegram" /></a>
                  <a href="#" target="_blank" rel="noreferrer"><i className="fab fa-square-instagram" /></a>
                  <a href="https://youtube.com/@binancematrixclan" target="_blank" rel="noreferrer"><i className="fab fa-youtube" /></a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <Script id="matrix-site-base" strategy="afterInteractive">
        {`window.SITE_BASE_URL = 'https://matrixclan.com/';`}
      </Script>
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      <Script src="https://matrixclan.com/assets/js/language-selector.js" strategy="afterInteractive" />
      <Script src="https://matrixclan.com/assets/js/binance-dropdown.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.js" strategy="afterInteractive" />

      <style jsx global>{`
        .matrix-mirror-root {
          position: relative;
          z-index: 1;
        }

        .matrix-mirror-root #matrix-rain-container {
          z-index: -1 !important;
          opacity: 0.3 !important;
        }

        .matrix-mirror-root .row {
          align-items: unset !important;
          gap: 0 !important;
        }

        .matrix-mirror-root .container {
          max-width: 1400px !important;
        }

        .matrix-mirror-root .character-card {
          padding: 1% !important;
          min-height: auto !important;
        }

        .matrix-mirror-root .character-card .row {
          margin-left: 0;
          margin-right: 0;
        }

        .matrix-mirror-root .characters-section {
          padding: 72px 0 60px !important;
        }

        .matrix-mirror-root .section-title {
          margin-bottom: 32px !important;
        }

        .matrix-mirror-root .character-row {
          margin-bottom: 44px !important;
        }

        .matrix-mirror-root .character-card {
          max-width: 1180px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .matrix-mirror-root .swiper-pagination-bullet {
          background: var(--matrix-green-bright) !important;
          opacity: 0.75 !important;
        }

        .matrix-mirror-root .swiper-pagination-bullet-active {
          background: #fff !important;
          opacity: 1 !important;
        }

        .matrix-mirror-root .swiper-button-prev,
        .matrix-mirror-root .swiper-button-next {
          color: var(--matrix-green-bright) !important;
          text-shadow: 0 0 8px rgba(0, 255, 0, 0.55);
        }

        @media (max-width: 768px) {
          .matrix-mirror-root .hero-slider {
            margin-top: 96px !important;
          }

          .matrix-mirror-root .characters-section {
            padding: 60px 0 42px !important;
          }

          .matrix-mirror-root .character-card {
            margin-bottom: 28px !important;
            max-width: none !important;
          }

          .matrix-mirror-root .character-image {
            padding: 14px !important;
          }

          .matrix-mirror-root .character-info {
            padding: 8px 14px 16px !important;
          }

          .matrix-mirror-root .character-info h3 {
            margin-bottom: 8px !important;
          }

          .matrix-mirror-root .character-info .token {
            margin-bottom: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
