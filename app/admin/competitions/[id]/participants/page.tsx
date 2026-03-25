import { notFound } from "next/navigation";
import { AdminParticipantManagement } from "@/components/admin-participant-management";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export default async function ParticipantsPage({
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

  const eventParticipants = store.getParticipants(id);

  return (
    <AdminShell
      title="Participant Management"
      description="Moderation, duplicate review, manual overrides, and wheel eligibility management."
    >
      <AdminParticipantManagement
        competitionId={competition.id}
        competitionTitle={competition.title}
        competitionOptions={competitions.map((entry) => ({
          id: entry.id,
          title: entry.title
        }))}
        initialParticipants={eventParticipants}
        canEdit={canAdminPerform(admin, "participants", "edit")}
        canAdd={canAdminPerform(admin, "participants", "add")}
      />
    </AdminShell>
  );
}
