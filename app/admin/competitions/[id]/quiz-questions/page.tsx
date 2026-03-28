import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminQuizQuestionsPanel } from "@/components/admin-quiz-questions-panel";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export default async function AdminCompetitionQuizQuestionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPagePermission("competitions", "edit");

  const { id } = await params;
  const competition = store.getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const competitions = store.listCompetitions();
  const questions = store.listQuizQuestions(id);

  return (
    <AdminShell
      title="Quiz Questions"
      description="Configure timed quiz rounds for this competition. Questions will rotate automatically after their timer expires."
    >
      <AdminQuizQuestionsPanel
        competitionId={competition.id}
        competitionTitle={competition.title}
        competitionOptions={competitions.map((entry) => ({ id: entry.id, title: entry.title }))}
        initialQuestions={questions}
      />
    </AdminShell>
  );
}
