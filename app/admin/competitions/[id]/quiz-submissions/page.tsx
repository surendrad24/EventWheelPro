import { notFound } from "next/navigation";
import { AdminQuizSubmissionsPanel } from "@/components/admin-quiz-submissions-panel";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export default async function AdminCompetitionQuizSubmissionsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPagePermission("live_control", "view");

  const { id } = await params;
  const competition = store.getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const competitions = store.listCompetitions();
  const submissions = store.listQuizSubmissions(id);
  const questions = store.listQuizQuestions(id, { includeAnswers: false });

  return (
    <AdminShell
      title="Quiz Submissions"
      description="Review every submitted quiz answer with correctness, question context, and participant details."
    >
      <AdminQuizSubmissionsPanel
        competitionId={competition.id}
        competitionTitle={competition.title}
        competitionOptions={competitions.map((entry) => ({ id: entry.id, title: entry.title }))}
        initialSubmissions={submissions}
        questions={questions}
      />
    </AdminShell>
  );
}
