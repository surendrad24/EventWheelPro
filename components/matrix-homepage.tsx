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

type HeaderCompetition = {
  id: string;
  slug: string;
  title: string;
  status: string;
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

const languages = [
  { label: "English", flag: "us" },
  { label: "中文", flag: "cn" },
  { label: "Español", flag: "es" },
  { label: "العربية", flag: "sa" },
  { label: "Français", flag: "fr" },
  { label: "Bahasa Indonesia", flag: "id" },
  { label: "Deutsch", flag: "de" }
];

const binanceRefs: Record<string, string> = {
  alondracrypto: "https://www.binance.com/join?ref=856185087",
  elexrocks: "https://accounts.binance.com/register?ref=869861277",
  keanuleafes: "https://www.binance.com/join?ref=SCHWEIZ",
  princepistolero: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM",
  earnpii: "https://accounts.binance.com/register?ref=61172094",
  mmh: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM",
  yahia: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM",
  dibimed: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00IOAETWN5",
  ovmars: "https://accounts.binance.com/register?ref=61172094"
};

export function MatrixHomepage({
  competitions = []
}: {
  competitions?: HeaderCompetition[];
}) {
  useEffect(() => {
    const hamburger = document.querySelector<HTMLElement>(".hamburger-menu");
    const mobileMenu = document.querySelector<HTMLElement>(".mobile-menu");

    const toggleMobile = () => {
      hamburger?.classList.toggle("open");
      mobileMenu?.classList.toggle("open");
    };

    hamburger?.addEventListener("click", toggleMobile);

    const toggles = Array.from(document.querySelectorAll<HTMLElement>(".mobile-menu-toggle"));
    const onToggleClick = (event: Event) => {
      const element = event.currentTarget as HTMLElement;
      const target = element.getAttribute("data-target");
      if (!target) {
        return;
      }

      const submenu = document.getElementById(target);
      const isOpen = element.classList.contains("active");

      toggles.forEach((toggle) => {
        const id = toggle.getAttribute("data-target");
        toggle.classList.remove("active");
        if (id) {
          document.getElementById(id)?.classList.remove("open");
        }
      });

      if (!isOpen) {
        element.classList.add("active");
        submenu?.classList.add("open");
      }
    };

    toggles.forEach((toggle) => toggle.addEventListener("click", onToggleClick));

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
      hamburger?.removeEventListener("click", toggleMobile);
      toggles.forEach((toggle) => toggle.removeEventListener("click", onToggleClick));
      window.clearInterval(interval);
      window.__matrixSwiper?.destroy?.();
      window.__matrixSwiper = undefined;
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/matrix-rain.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/style.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/menu.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/language-selector.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/binance-dropdown.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/music-modal.css" />
      <link rel="stylesheet" href="https://matrixclan.com/assets/css/mobile-menu-redesign.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@8/swiper-bundle.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      <div className="matrix-mirror-root">
        <MatrixRainBackground />
        <header className="fixed-top py-3">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-3 col-6">
                <a href="/" className="logo matrix-gradient-text matrix-font">FUSION MATRIX</a>
              </div>

              <div className="col-md-6 desktop-nav">
                <nav className="d-flex justify-content-center">
                  <ul className="nav">
                    <li className="nav-item"><a className="nav-link" href="/tank">Tokens <span className="nav-badge nav-badge-green">NEW</span></a></li>
                    <li className="nav-item"><a className="nav-link" href="/heroes">Heroes</a></li>
                    <li className="nav-item"><a className="nav-link" href="/comics">Comics</a></li>
                    <li className="nav-item"><a className="nav-link" href="/profile">Profile</a></li>
                    <li className="nav-item matrix-competitions-nav-item">
                      <a className="nav-link nav-link-btc-wheel" href="/competitions">Competitions</a>
                      {competitions.length > 0 ? (
                        <div className="matrix-competitions-dropdown">
                          {competitions.map((competition) => (
                            <a
                              key={competition.id}
                              href={`/competitions?competition=${encodeURIComponent(competition.slug)}`}
                              className="matrix-competition-option"
                            >
                              <span>{competition.title}</span>
                              <em>{competition.status}</em>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  </ul>
                </nav>
              </div>

              <div className="col-md-3 col-6">
                <div className="d-flex justify-content-end align-items-center">
                  <div className="socials-dropdown">
                    <div className="socials-icon"><i className="fas fa-share-nodes" /></div>
                    <div className="socials-dropdown-menu">
                      <a href="https://x.com/keanuleafes" target="_blank" className="socials-option" rel="noreferrer"><i className="fab fa-square-x-twitter" /><span>X: Follow on X</span></a>
                      <a href="https://t.me/CryptoMatrixTeam" target="_blank" className="socials-option" rel="noreferrer"><i className="fab fa-telegram" /><span>TG: Follow on TG</span></a>
                      <a href="#" target="_blank" className="socials-option" rel="noreferrer"><i className="fab fa-square-instagram" /><span>IG: Follow on IG</span></a>
                      <a href="https://music.youtube.com/channel/UCz0wa0vRsJGiWfHx_yoo9vw" target="_blank" className="socials-option" rel="noreferrer"><i className="fab fa-youtube" /><span>Fusion Matrix Music</span></a>
                    </div>
                  </div>

                  <div className="binance-dropdown">
                    <div className="binance-icon">
                      <img src="https://matrixclan.com/assets/images/logos/binance.png" alt="Binance" className="binance-logo" />
                    </div>
                    <div className="binance-dropdown-menu">
                      <div className="binance-dropdown-header"><h4>Find Heroes on Binance</h4></div>
                      {characters.map((hero) => (
                        <a key={hero.id} className="binance-hero-item" href={binanceRefs[hero.id]} target="_blank" rel="noreferrer" style={{ ["--hero-color" as string]: hero.color }}>
                          <img src={`https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.jpg`} alt={hero.name} className="binance-hero-avatar" />
                          <div className="binance-hero-info">
                            <div className="binance-hero-name">{hero.name}</div>
                            <div className="binance-hero-text">Find {hero.name} on Binance</div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="language-selector desktop">
                    <div className="language-selector-toggle">
                      <i className="fas fa-globe language-icon" />
                    </div>
                    <div className="language-selector-dropdown">
                      {languages.map((lang, index) => (
                        <a key={lang.label} href="#" className={`language-option ${index === 0 ? "active" : ""}`}>
                          <img src={`https://matrixclan.com/assets/images/flags/${lang.flag}.png`} alt={lang.label} />
                          {lang.label}
                        </a>
                      ))}
                    </div>
                  </div>

                  <button className="music-modal-btn" title="Music" type="button"><i className="fas fa-music" /></button>
                </div>

                <div className="mobile-header-icons">
                  <div className="hamburger-menu">
                    <span />
                    <span />
                    <span />
                  </div>
                  <button className="music-modal-btn mobile-only" title="Music" type="button"><i className="fas fa-music" /></button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="mobile-menu">
          <div className="mobile-menu-section">
            <div className="mobile-menu-toggle" data-target="pages-submenu"><span>Pages</span><i className="fas fa-caret-down" /></div>
            <ul className="mobile-submenu" id="pages-submenu">
              <li><a href="/tank">Tokens</a></li>
              <li><a href="/heroes">Heroes</a></li>
              <li><a href="/comics">Comics</a></li>
              <li><a href="/profile">Profile</a></li>
            </ul>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-toggle" data-target="competitions-submenu"><span>Competitions</span><i className="fas fa-caret-down" /></div>
            <ul className="mobile-submenu" id="competitions-submenu">
              {competitions.map((competition) => (
                <li key={competition.id}>
                  <a href={`/competitions?competition=${encodeURIComponent(competition.slug)}`}>{competition.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-toggle" data-target="binance-submenu"><span>Find Us on Binance</span><i className="fas fa-caret-down" /></div>
            <ul className="mobile-submenu binance-submenu" id="binance-submenu">
              {characters.map((hero) => (
                <li key={hero.id}>
                  <a href={binanceRefs[hero.id]} target="_blank" rel="noreferrer">
                    <img src={`https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.jpg`} alt={hero.name} />
                    <span>{hero.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-toggle" data-target="socials-submenu"><span>Social Links</span><i className="fas fa-caret-down" /></div>
            <ul className="mobile-submenu" id="socials-submenu">
              <li><a href="https://x.com/keanuleafes" target="_blank" rel="noreferrer"><i className="fab fa-square-x-twitter" /><span>X: Follow on X</span></a></li>
              <li><a href="https://t.me/CryptoMatrixTeam" target="_blank" rel="noreferrer"><i className="fab fa-telegram" /><span>TG: Follow on TG</span></a></li>
              <li><a href="#" target="_blank" rel="noreferrer"><i className="fab fa-square-instagram" /><span>IG: Follow on IG</span></a></li>
              <li><a href="https://music.youtube.com/channel/UCz0wa0vRsJGiWfHx_yoo9vw" target="_blank" rel="noreferrer"><i className="fab fa-youtube" /><span>Fusion Matrix Music</span></a></li>
            </ul>
          </div>

          <div className="mobile-menu-section">
            <div className="mobile-menu-toggle" data-target="language-submenu"><span><img src="https://matrixclan.com/assets/images/flags/us.png" alt="English" className="current-flag" />English</span><i className="fas fa-caret-down" /></div>
            <ul className="mobile-submenu" id="language-submenu">
              {languages.map((lang, index) => (
                <li key={lang.label}>
                  <a href="#" className={index === 0 ? "active" : ""}>
                    <img src={`https://matrixclan.com/assets/images/flags/${lang.flag}.png`} alt={lang.label} />
                    <span>{lang.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

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
            <h2 className="section-title matrix-gradient-text matrix-font">MEET THE DEFENDERS OF ASSETS</h2>
            {characters.map((hero) => (
              <div className="row character-row mb-4" key={hero.id}>
                <div className="col-12">
                  <div className="character-card matrix-animated-border" style={{ ["--matrix-green-bright" as string]: hero.color }}>
                    <div className={`row ${hero.reverse ? "flex-row-reverse" : ""}`}>
                      <div className="col-md-3 character-image">
                        <img src={hero.image} alt={hero.name} style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: 0 }} />
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
          padding: 0 !important;
          min-height: auto !important;
        }

        .matrix-mirror-root .character-card .row {
          margin-left: calc(var(--bs-gutter-x) * -0.5);
          margin-right: calc(var(--bs-gutter-x) * -0.5);
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

        .matrix-mirror-root .logo {
          white-space: nowrap !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          display: inline-block !important;
          line-height: 1 !important;
        }

        .matrix-mirror-root .matrix-competitions-nav-item {
          position: relative;
        }

        .matrix-mirror-root .matrix-competitions-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 320px;
          background: rgba(0, 0, 0, 0.96);
          border: 1px solid rgba(0, 255, 0, 0.4);
          border-radius: 12px;
          padding: 10px;
          box-shadow: 0 0 18px rgba(0, 255, 0, 0.2);
          display: none;
          z-index: 40;
        }

        .matrix-mirror-root .matrix-competitions-nav-item:hover .matrix-competitions-dropdown {
          display: block;
        }

        .matrix-mirror-root .matrix-competition-option {
          width: 100%;
          border: 1px solid rgba(0, 255, 0, 0.28);
          border-radius: 10px;
          background: rgba(0, 20, 0, 0.7);
          color: #b1ffbb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 11px;
          margin-bottom: 8px;
          text-align: left;
          text-decoration: none;
        }

        .matrix-mirror-root .matrix-competition-option:last-child {
          margin-bottom: 0;
        }

        .matrix-mirror-root .matrix-competition-option em {
          color: #59ff7d;
          font-style: normal;
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .matrix-mirror-root header {
            min-height: 70px;
          }

          .matrix-mirror-root .logo {
            font-size: 1.5rem !important;
            letter-spacing: 0.08em !important;
          }

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
