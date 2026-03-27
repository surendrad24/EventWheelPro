import { AdminDashboardStatsPanel } from "@/components/admin-dashboard-stats-panel";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { getAdminDashboardStats } from "@/lib/server/dashboard-stats";
import { store } from "@/lib/server/in-memory-store";

export default async function AdminDashboardPage() {
  await requireAdminPagePermission("dashboard", "view");
  const competitions = store.listCompetitions();
  const recentLogs = store.getLogs().slice(0, 8);
  const dashboardStats = getAdminDashboardStats();

  return (
    <AdminShell
      title="Operations Dashboard"
      description="A fast operator view into live events, pending verification, spin outcomes, and payout workload."
    >
      <AdminDashboardStatsPanel initialStats={dashboardStats} />

      <section className="card card-pad stack">
        <h2 className="section-title">Quick actions</h2>
        <div className="quick-actions-row">
          <a className="btn" href="/admin/competitions/new">Create competition</a>
          {competitions[0] && <a className="btn-secondary" href={`/admin/competitions/${competitions[0].id}/participants`}>Moderate participants</a>}
          {competitions[0] && <a className="btn-secondary" href={`/admin/competitions/${competitions[0].id}/live-control`}>Open live control</a>}
        </div>
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="card card-pad stack">
          <div className="row-between">
            <h2 className="section-title">Recent logs</h2>
            <a className="btn-secondary" href="/admin/logs">View all</a>
          </div>
          {recentLogs.map((log) => (
            <div key={log.id} className="list-item">
              <strong>{log.action}</strong>
              <div className="muted">{log.payloadSummary}</div>
            </div>
          ))}
        </article>
      </section>
    </AdminShell>
  );
}
