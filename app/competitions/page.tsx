import { MatrixPage } from "@/components/matrix-site";
import { MatrixQuizTemplate } from "@/components/matrix-quiz-template";
import { MatrixWheelClient } from "@/components/matrix-wheel-client";
import { store } from "@/lib/server/in-memory-store";

export default async function CompetitionIndexPage({
  searchParams
}: {
  searchParams?: Promise<{ competition?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const competitions = store.listCompetitions();
  const defaultCompetition = competitions[0];
  const selectedBySlug = params.competition
    ? store.getCompetitionBySlug(params.competition)
    : null;
  const competition = selectedBySlug ?? defaultCompetition;

  if (!competition) {
    return (
      <MatrixPage>
        <section className="card card-pad">
          <h1 className="title-lg">No Competitions Available</h1>
          <p className="muted">Create a competition from admin panel to render this page.</p>
        </section>
      </MatrixPage>
    );
  }

  const participants = store.getParticipants(competition.id);
  const winners = store.listWinners(competition.id);
  const isQuizMode = competition.gameType === "quiz";

  return (
    <MatrixPage>
      {isQuizMode ? (
        <MatrixQuizTemplate competition={competition} participants={participants} winners={winners} />
      ) : (
        <MatrixWheelClient competition={competition} participants={participants} winners={winners} />
      )}
    </MatrixPage>
  );
}
