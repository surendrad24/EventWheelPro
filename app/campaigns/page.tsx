import { MatrixPage } from "@/components/matrix-site";
import { matrixComics, matrixHeroes } from "@/lib/matrix-data";

export default function CampaignsPage() {
  return (
    <MatrixPage>
      <section className="matrix-page-head matrix-comics-head">
        <div className="eyebrow">FUSION MATRIX CAMPAIGNS</div>
        <div className="matrix-comics-title-rule" aria-hidden="true" />
        <h1 className="title-lg">Follow Fusion Matrix Campaigns</h1>
        <p>Each campaign introduces new missions, story arcs, rewards, and community-driven objectives.</p>
        <div className="matrix-page-metrics">
          <article>
            <strong>{matrixComics.length}</strong>
            <span>Campaign Tracks</span>
          </article>
          <article>
            <strong>3</strong>
            <span>Active Campaign Arcs</span>
          </article>
          <article>
            <strong>LIVE</strong>
            <span>Campaign Updates</span>
          </article>
        </div>
      </section>

      <section className="matrix-comics-grid">
        {matrixComics.map((comic, index) => (
          <article key={comic.title} className="matrix-comic-card">
            <img src={comic.image} alt={comic.title} className="matrix-comic-cover" />
            <div className="matrix-hero-copy matrix-comic-copy">
              <h2>{comic.title}</h2>
              <div className="matrix-comic-volume">{comic.volume}</div>
              <p>{comic.summary}</p>

              {index === 0 ? (
                <div className="matrix-comic-footer is-live">
                  <div className="matrix-comic-release live">Released: May 2025</div>
                  <div className="matrix-comic-featured">Featured Heroes:</div>
                  <div className="matrix-comic-heroes">
                    {matrixHeroes.slice(0, 4).map((hero) => (
                      <img key={hero.name} src={hero.image} alt={hero.name} className="matrix-comic-hero-chip" />
                    ))}
                  </div>
                  <a href="#" className="matrix-comic-cta">
                    JOIN CAMPAIGN
                  </a>
                </div>
              ) : (
                <div className="matrix-comic-footer">
                  <div className="matrix-comic-release">Launch: Coming Soon</div>
                  <span className="matrix-comic-cta is-disabled">COMING SOON</span>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="matrix-comics-prompt-wrap">
        <div className="matrix-comics-prompt">
          New campaigns are announced first in the Fusion Matrix community channels.
        </div>
      </section>
    </MatrixPage>
  );
}
