import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { formatDateTime } from "@/lib/format";
import { getCompetitionById, getCompetitionWinners } from "@/lib/mock-data";

export default async function AdminWinnersPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const maybeCompetition = getCompetitionById(id);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const eventWinners = getCompetitionWinners(id);

  return (
    <AdminShell
      title="Winners"
      description="Track recent wins, claim states, and public winner visibility."
    >
      <section className="card card-pad">
        <table className="table">
          <thead>
            <tr>
              <th>Winner</th>
              <th>Prize</th>
              <th>Won At</th>
              <th>Claim</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            {eventWinners.map((winner) => (
              <tr key={winner.id}>
                <td>{winner.displayName}</td>
                <td>{winner.prizeLabel}</td>
                <td>{formatDateTime(winner.wonAt)}</td>
                <td><StatusChip label={winner.claimStatus} /></td>
                <td><StatusChip label={winner.payoutStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
