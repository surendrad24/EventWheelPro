import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/site-chrome";
import { StatusChip } from "@/components/status-chip";
import { formatDateTime } from "@/lib/format";
import { getCompetitionBySlug, getCompetitionWinners } from "@/lib/mock-data";

export default async function WinnersPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maybeCompetition = getCompetitionBySlug(slug);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const eventWinners = getCompetitionWinners(competition.id);

  return (
    <>
      <SiteChrome />
      <main className="page shell stack">
        <section className="card card-pad">
          <div className="eyebrow">Winner History</div>
          <h1 className="title-lg">{competition.title}</h1>
        </section>
        <section className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {eventWinners.map((winner) => (
            <article className="card card-pad stack" key={winner.id}>
              <div className="row-between">
                <strong>{winner.displayName}</strong>
                <StatusChip label={winner.payoutStatus} />
              </div>
              <div className="muted">{winner.prizeLabel}</div>
              <div className="muted">Round {winner.roundNumber} • {formatDateTime(winner.wonAt)}</div>
              <StatusChip label={winner.claimStatus} />
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
