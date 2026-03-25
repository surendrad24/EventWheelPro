import { notFound } from "next/navigation";
import { AdminWinnersManagement } from "@/components/admin-winners-management";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export default async function AdminWinnersPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPagePermission("participants", "view");
  const { id } = await params;
  const maybeCompetition = store.getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;
  const competitions = store.listCompetitions();
  const eventWinners = store.listWinners(id);

  return (
    <AdminShell
      title="Winners"
      description="Track recent wins, claim states, and public winner visibility."
    >
      <AdminWinnersManagement
        competitionId={competition.id}
        competitionTitle={competition.title}
        competitionOptions={competitions.map((entry) => ({ id: entry.id, title: entry.title }))}
        initialWinners={eventWinners}
        canEditClaim={canAdminPerform(admin, "participants", "edit")}
        canEditPayout={canAdminPerform(admin, "payouts", "edit")}
      />
    </AdminShell>
  );
}
