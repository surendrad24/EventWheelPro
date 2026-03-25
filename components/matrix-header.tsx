"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BinanceHero = {
  id: string;
  name: string;
  referral: string;
  color: string;
};

const languages = [
  { code: "en", label: "English", flag: "us" },
  { code: "zh", label: "中文", flag: "cn" },
  { code: "es", label: "Español", flag: "es" },
  { code: "ar", label: "العربية", flag: "sa" },
  { code: "fr", label: "Français", flag: "fr" },
  { code: "id", label: "Bahasa Indonesia", flag: "id" },
  { code: "de", label: "Deutsch", flag: "de" }
];

const binanceHeroes: BinanceHero[] = [
  { id: "alondracrypto", name: "AlondraCrypto", referral: "https://www.binance.com/join?ref=856185087", color: "#F3BA2F" },
  { id: "elexrocks", name: "Elex-Rocks", referral: "https://accounts.binance.com/register?ref=869861277", color: "#727DF5" },
  { id: "keanuleafes", name: "KeanuLeafes", referral: "https://www.binance.com/join?ref=SCHWEIZ", color: "#BA9F33" },
  { id: "princepistolero", name: "PrincePistolero", referral: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM", color: "#9370db" },
  { id: "earnpii", name: "Earnpii", referral: "https://accounts.binance.com/register?ref=61172094", color: "#9932cc" },
  { id: "mmh", name: "MMH", referral: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM", color: "#F7931A" },
  { id: "yahia", name: "Yahia", referral: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00EN4WE8PM", color: "#23292F" },
  { id: "dibimed", name: "DibiMed", referral: "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_00IOAETWN5", color: "#4DA6FF" },
  { id: "ovmars", name: "OVMARS", referral: "https://accounts.binance.com/register?ref=61172094", color: "#9932cc" }
];

export function MatrixHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [binanceOpen, setBinanceOpen] = useState(false);

  const currentLang = languages[0];

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    const onClick = () => {
      setLanguageOpen(false);
      setBinanceOpen(false);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileSection(null);
    }
  }, [mobileOpen]);

  const mobilePages = useMemo(
    () => [
      { href: "/tank", label: "Tokens" },
      { href: "/heroes", label: "Heroes" },
      { href: "/comics", label: "Comics" },
      { href: "/profile", label: "Profile" },
      { href: "/wheel", label: "BTC Wheel" }
    ],
    []
  );

  const toggleSection = (id: string) => {
    setMobileSection((current) => (current === id ? null : id));
  };

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileSection(null);
  };

  return (
    <>
      <header className={`matrix-header matrix-header-parity ${isScrolled ? "scrolled" : ""}`}>
        <div className="shell matrix-header-shell">
          <div className="matrix-header-left">
            <Link href="/" className="logo matrix-gradient-text matrix-font">
              TEAM MATRIX
            </Link>
          </div>

          <div className="desktop-nav">
            <nav className="matrix-nav-center">
              <ul className="nav">
                <li className="nav-item">
                  <Link className="nav-link" href="/tank">
                    Tokens <span className="nav-badge nav-badge-green">NEW</span>
                  </Link>
                </li>
                <li className="nav-item"><Link className="nav-link" href="/heroes">Heroes</Link></li>
                <li className="nav-item"><Link className="nav-link" href="/comics">Comics</Link></li>
                <li className="nav-item"><Link className="nav-link" href="/profile">Profile</Link></li>
                <li className="nav-item"><Link className="nav-link nav-link-btc-wheel" href="/wheel">BTC Wheel</Link></li>
              </ul>
            </nav>
          </div>

          <div className="matrix-header-right">
            <div className="header-icons-desktop">
              <div className="socials-dropdown">
                <div className="socials-icon">
                  <i className="fas fa-share-nodes" />
                </div>
                <div className="socials-dropdown-menu">
                  <a href="https://x.com/keanuleafes" target="_blank" rel="noreferrer" className="socials-option">
                    <i className="fab fa-square-x-twitter" />
                    <span>X: Follow on X</span>
                  </a>
                  <a href="https://t.me/CryptoMatrixTeam" target="_blank" rel="noreferrer" className="socials-option">
                    <i className="fab fa-telegram" />
                    <span>TG: Follow on TG</span>
                  </a>
                  <a href="#" target="_blank" rel="noreferrer" className="socials-option">
                    <i className="fab fa-square-instagram" />
                    <span>IG: Follow on IG</span>
                  </a>
                  <a href="https://music.youtube.com/channel/UCz0wa0vRsJGiWfHx_yoo9vw" target="_blank" rel="noreferrer" className="socials-option">
                    <i className="fab fa-youtube" />
                    <span>Team Matrix Music</span>
                  </a>
                </div>
              </div>

              <div className={`binance-dropdown ${binanceOpen ? "active" : ""}`} onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="binance-icon-btn"
                  onClick={() => setBinanceOpen((open) => !open)}
                  aria-label="Open Binance heroes"
                >
                  <img src="https://matrixclan.com/assets/images/logos/binance.png" alt="Binance" className="binance-logo" />
                </button>
                <div className="binance-dropdown-menu">
                  <div className="binance-dropdown-header">
                    <h4>Find Heroes on Binance</h4>
                  </div>
                  {binanceHeroes.map((hero) => (
                    <a
                      key={hero.id}
                      className="binance-hero-item"
                      href={hero.referral}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ["--hero-color" as string]: hero.color }}
                    >
                      <img
                        src={`https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.jpg`}
                        alt={hero.name}
                        className="binance-hero-avatar"
                        onError={(event) => {
                          event.currentTarget.src = `https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.png`;
                        }}
                      />
                      <div className="binance-hero-info">
                        <div className="binance-hero-name">{hero.name}</div>
                        <div className="binance-hero-text">Find {hero.name} on Binance</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className={`language-selector desktop ${languageOpen ? "open" : ""}`} onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="language-selector-toggle"
                  aria-label="Language selector"
                  onClick={() => setLanguageOpen((open) => !open)}
                >
                  <i className="fas fa-globe language-icon" />
                </button>
                <div className="language-selector-dropdown">
                  {languages.map((language) => (
                    <a key={language.code} href="#" className={`language-option ${language.code === currentLang.code ? "active" : ""}`}>
                      <img src={`https://matrixclan.com/assets/images/flags/${language.flag}.png`} alt={language.label} />
                      {language.label}
                    </a>
                  ))}
                </div>
              </div>

              <button className="music-modal-btn" title="Music" type="button" aria-label="Open music">
                <i className="fas fa-music" />
              </button>
            </div>

            <div className="mobile-header-icons">
              <button type="button" className={`hamburger-menu ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle mobile menu">
                <span />
                <span />
                <span />
              </button>
              <button className="music-modal-btn mobile-only" title="Music" type="button" aria-label="Open music">
                <i className="fas fa-music" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <div className="mobile-menu-section">
          <button type="button" className={`mobile-menu-toggle ${mobileSection === "pages" ? "active" : ""}`} onClick={() => toggleSection("pages")}>
            <span>Pages</span>
            <i className="fas fa-caret-down" />
          </button>
          <ul className={`mobile-submenu ${mobileSection === "pages" ? "open" : ""}`}>
            {mobilePages.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={closeMobileMenu}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mobile-menu-section">
          <button type="button" className={`mobile-menu-toggle ${mobileSection === "binance" ? "active" : ""}`} onClick={() => toggleSection("binance")}>
            <span>Find Us on Binance</span>
            <i className="fas fa-caret-down" />
          </button>
          <ul className={`mobile-submenu binance-submenu ${mobileSection === "binance" ? "open" : ""}`}>
            {binanceHeroes.map((hero) => (
              <li key={hero.id}>
                <a href={hero.referral} target="_blank" rel="noreferrer">
                  <img
                    src={`https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.jpg`}
                    alt={hero.name}
                    onError={(event) => {
                      event.currentTarget.src = `https://matrixclan.com/assets/images/characters/portraits/thumbnails/${hero.id}_portrait.png`;
                    }}
                  />
                  <span>{hero.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mobile-menu-section">
          <button type="button" className={`mobile-menu-toggle ${mobileSection === "social" ? "active" : ""}`} onClick={() => toggleSection("social")}>
            <span>Social Links</span>
            <i className="fas fa-caret-down" />
          </button>
          <ul className={`mobile-submenu ${mobileSection === "social" ? "open" : ""}`}>
            <li>
              <a href="https://x.com/keanuleafes" target="_blank" rel="noreferrer">
                <i className="fab fa-square-x-twitter" />
                <span>X: Follow on X</span>
              </a>
            </li>
            <li>
              <a href="https://t.me/CryptoMatrixTeam" target="_blank" rel="noreferrer">
                <i className="fab fa-telegram" />
                <span>TG: Follow on TG</span>
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noreferrer">
                <i className="fab fa-square-instagram" />
                <span>IG: Follow on IG</span>
              </a>
            </li>
            <li>
              <a href="https://music.youtube.com/channel/UCz0wa0vRsJGiWfHx_yoo9vw" target="_blank" rel="noreferrer">
                <i className="fab fa-youtube" />
                <span>Team Matrix Music</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="mobile-menu-section">
          <button type="button" className={`mobile-menu-toggle ${mobileSection === "language" ? "active" : ""}`} onClick={() => toggleSection("language")}>
            <span>
              <img src={`https://matrixclan.com/assets/images/flags/${currentLang.flag}.png`} alt={currentLang.label} className="current-flag" />
              {currentLang.label}
            </span>
            <i className="fas fa-caret-down" />
          </button>
          <ul className={`mobile-submenu ${mobileSection === "language" ? "open" : ""}`}>
            {languages.map((language) => (
              <li key={language.code}>
                <a href="#" className={language.code === currentLang.code ? "active" : ""}>
                  <img src={`https://matrixclan.com/assets/images/flags/${language.flag}.png`} alt={language.label} />
                  <span>{language.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
