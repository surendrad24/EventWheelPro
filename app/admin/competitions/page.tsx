import Link from "next/link";
import { AdminCloneCompetitionButton } from "@/components/admin-clone-competition-button";
import { AdminShell } from "@/components/admin-shell";
import { StatusChip } from "@/components/status-chip";
import { formatDateTime } from "@/lib/format";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export default async function CompetitionsPage() {
  const admin = await requireAdminPagePermission("competitions", "view");
  const competitions = store.listCompetitions();
  const canClone = canAdminPerform(admin, "competitions", "add");

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
                  <div className="wrap" style={{ justifyContent: "flex-end" }}>
                    <Link className="btn-ghost" href={`/admin/competitions/${competition.id}`}>
                      Edit
                    </Link>
                    {canClone && (
                      <AdminCloneCompetitionButton
                        competitionId={competition.id}
                        className="btn-ghost"
                        label="Clone"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
