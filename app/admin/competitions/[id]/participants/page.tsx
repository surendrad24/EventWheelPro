import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { formatPercent } from "@/lib/format";
import { store } from "@/lib/server/in-memory-store";

export default async function ParticipantsPage({
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

  const eventParticipants = store.getParticipants(id);

  return (
    <AdminShell
      title="Participant Management"
      description="Moderation, duplicate review, manual overrides, and wheel eligibility management."
    >
      <section className="card card-pad">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section-title">{competition.title}</h2>
          <div className="wrap">
            <button className="btn-secondary">Bulk approve</button>
            <button className="btn-secondary">Import CSV</button>
            <button className="btn">Export</button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Registration</th>
              <th>Verification</th>
              <th>Duplicate Risk</th>
              <th>Country</th>
            </tr>
          </thead>
          <tbody>
            {eventParticipants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.displayName}</td>
                <td><StatusChip label={participant.registrationStatus} /></td>
                <td><StatusChip label={participant.verificationStatus} /></td>
                <td>{formatPercent(participant.duplicateRiskScore)}</td>
                <td>{participant.country}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
