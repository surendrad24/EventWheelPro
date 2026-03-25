import { notFound } from "next/navigation";
import { SiteChrome } from "@/components/site-chrome";
import { StatusChip } from "@/components/status-chip";
import { store } from "@/lib/server/in-memory-store";

export default async function LeaderboardPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maybeCompetition = store.getCompetitionBySlug(slug);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const ranked = [...store.getParticipants(competition.id)].sort((a, b) => b.wins - a.wins);

  return (
    <>
      <SiteChrome />
      <main className="page shell stack">
        <section className="card card-pad">
          <div className="eyebrow">Leaderboard</div>
          <h1 className="title-lg">{competition.title}</h1>
          <p className="muted">Public leaderboard visibility is {competition.leaderboardPublic ? "enabled" : "disabled"} for this event.</p>
        </section>
        <section className="card card-pad">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Nickname</th>
                <th>Wins</th>
                <th>Status</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((participant, index) => (
                <tr key={participant.id}>
                  <td>#{index + 1}</td>
                  <td>{participant.displayName}</td>
                  <td>{participant.wins}</td>
                  <td><StatusChip label={participant.registrationStatus} /></td>
                  <td>{participant.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
