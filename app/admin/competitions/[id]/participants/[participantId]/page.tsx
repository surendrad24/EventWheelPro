import { notFound } from "next/navigation";
import { AdminParticipantEditor } from "@/components/admin-participant-editor";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export default async function ParticipantEditPage({
  params
}: {
  params: Promise<{ id: string; participantId: string }>;
}) {
  const admin = await requireAdminPagePermission("participants", "edit");

  const { id, participantId } = await params;
  const competition = store.getCompetitionById(id);
  const participant = store.getParticipantById(participantId);

  if (!competition || !participant || participant.competitionId !== competition.id) {
    notFound();
  }

  return (
    <AdminShell
      title="Edit Participant"
      description="Update participant profile, verification state, and moderation metadata."
    >
      <AdminParticipantEditor
        competitionId={competition.id}
        participant={participant}
        canDelete={canAdminPerform(admin, "participants", "delete")}
      />
    </AdminShell>
  );
}
