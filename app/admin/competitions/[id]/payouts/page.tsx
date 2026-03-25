import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { formatDate, formatDateTime } from "@/lib/format";
import { getCompetitionById, getCompetitionWinners } from "@/lib/mock-data";

export default async function PayoutsPage({
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
      title="Payout Tracking"
      description="Track claim deadlines, payout states, and transaction references."
    >
      <section className="card card-pad">
        <table className="table">
          <thead>
            <tr>
              <th>Winner</th>
              <th>Deadline</th>
              <th>Claim</th>
              <th>Payout</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {eventWinners.map((winner) => (
              <tr key={winner.id}>
                <td>{winner.displayName}</td>
                <td>{formatDate(winner.claimDeadlineAt)}</td>
                <td><StatusChip label={winner.claimStatus} /></td>
                <td><StatusChip label={winner.payoutStatus} /></td>
                <td>{winner.transactionReference ?? `Awaiting update as of ${formatDateTime(winner.wonAt)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
