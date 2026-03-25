import { MatrixPage } from "@/components/matrix-site";
import { matrixComics } from "@/lib/matrix-data";

export default function ComicsPage() {
  return (
    <MatrixPage>
      <section className="matrix-page-head matrix-comics-head">
        <div className="eyebrow">TEAM MATRIX Comics</div>
        <h1 className="title-lg">Follow the adventures of Team Matrix in our comic series</h1>
        <p>Every volume expands the Matrix lore with new villains, alliances, and token-powered battles.</p>
      </section>

      <section className="matrix-comics-grid">
        {matrixComics.map((comic) => (
          <article key={comic.title} className="matrix-comic-card">
            <img src={comic.image} alt={comic.title} className="matrix-comic-cover" />
            <div className="matrix-hero-copy matrix-comic-copy">
              <div className="matrix-comic-volume">{comic.volume}</div>
              <h2>{comic.title}</h2>
              <p>{comic.summary}</p>
              <div className={`matrix-comic-status ${comic.released === "Available now" ? "live" : ""}`}>Released: {comic.released}</div>
            </div>
          </article>
        ))}
      </section>

      <section className="matrix-comics-footer-note">
        <p>New chapters are announced first in the Team Matrix community channels.</p>
      </section>
    </MatrixPage>
  );
}
