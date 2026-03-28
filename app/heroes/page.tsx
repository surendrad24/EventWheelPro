import { MatrixPage } from "@/components/matrix-site";
import { matrixHeroes } from "@/lib/matrix-data";

export default function HeroesPage() {
  return (
    <MatrixPage>
      <section className="matrix-page-head matrix-heroes-head">
        <div className="eyebrow">FUSION MATRIX HEROES</div>
        <div className="matrix-heroes-title-rule" aria-hidden="true" />
        <h1 className="title-lg">Meet The Defenders Of Assets</h1>
        <p>Elite crypto guardians protecting the network, one block at a time.</p>
        <div className="matrix-page-metrics">
          <article>
            <strong>{matrixHeroes.length}</strong>
            <span>Active Heroes</span>
          </article>
          <article>
            <strong>9</strong>
            <span>Token Alliances</span>
          </article>
          <article>
            <strong>24/7</strong>
            <span>Network Watch</span>
          </article>
        </div>
      </section>

      <section className="matrix-heroes-grid">
        {matrixHeroes.map((hero) => (
          <article key={hero.name} className="matrix-hero-profile-card">
            <div className="matrix-hero-media-wrap">
              <img src={hero.image} alt={hero.name} />
              <span className="matrix-hero-token-chip">{hero.token}</span>
            </div>
            <div className="matrix-hero-copy matrix-hero-copy-upgraded">
              <h2>{hero.name}</h2>
              <div className="matrix-hero-role">{hero.role}</div>
              <p>{hero.summary}</p>
              <a href="/tokens/tank" className="matrix-hero-card-link">
                <span>View Token Mission</span>
                <i className="fas fa-arrow-right" />
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="matrix-heroes-prompt-wrap">
        <div className="matrix-heroes-prompt">
          Select a hero from above to view their details
        </div>
      </section>
    </MatrixPage>
  );
}
