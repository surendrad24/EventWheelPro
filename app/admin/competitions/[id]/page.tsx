import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminCloneCompetitionButton } from "@/components/admin-clone-competition-button";
import { CompetitionEditorForm } from "@/components/competition-editor-form";
import { StatCard } from "@/components/stat-card";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export default async function CompetitionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPagePermission("competitions", "view");
  const { id } = await params;
  const maybeCompetition = store.getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  return (
    <AdminShell title={competition.title} description={competition.description}>
      <section className="stats">
        <StatCard label="Participants" value={competition.stats.totalParticipants} hint="Total registrations" />
        <StatCard label="Pending" value={competition.stats.pendingVerification} hint="Awaiting review" />
        <StatCard label="Winners" value={competition.stats.totalWinners} hint="Recorded results" />
      </section>
      <CompetitionEditorForm mode="edit" competition={competition} />
      <section className="card card-pad stack">
        <h2 className="section-title">Competition actions</h2>
        <div className="wrap">
          <Link className="btn" href={`/admin/competitions/${competition.id}/participants`}>Participants</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/live-control`}>Live control</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/winners`}>Winners</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/payouts`}>Payouts</Link>
          {canAdminPerform(admin, "competitions", "add") && (
            <AdminCloneCompetitionButton competitionId={competition.id} className="btn-ghost" label="Clone competition" />
          )}
        </div>
      </section>
    </AdminShell>
  );
}
