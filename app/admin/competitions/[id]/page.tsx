import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { store } from "@/lib/server/in-memory-store";

export default async function CompetitionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
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
      <section className="card card-pad stack">
        <h2 className="section-title">Competition actions</h2>
        <div className="wrap">
          <Link className="btn" href={`/admin/competitions/${competition.id}/participants`}>Participants</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/live-control`}>Live control</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/winners`}>Winners</Link>
          <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/payouts`}>Payouts</Link>
        </div>
      </section>
    </AdminShell>
  );
}
