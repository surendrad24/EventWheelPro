import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { formatDateTime } from "@/lib/format";
import { store } from "@/lib/server/in-memory-store";

export default function CompetitionsPage() {
  const competitions = store.listCompetitions();

  return (
    <AdminShell
      title="Competitions"
      description="Create, clone, schedule, and manage competitions without editing code."
    >
      <section className="card card-pad">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section-title">All competitions</h2>
          <Link className="btn" href="/admin/competitions/new">New competition</Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Start</th>
              <th>Winners</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {competitions.map((competition) => (
              <tr key={competition.id}>
                <td>{competition.title}</td>
                <td><StatusChip label={competition.status} /></td>
                <td>{formatDateTime(competition.eventStartAt)}</td>
                <td>{competition.stats.totalWinners}/{competition.totalWinnerSlots}</td>
                <td>
                  <Link href={`/admin/competitions/${competition.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
