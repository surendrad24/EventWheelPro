import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { store } from "@/lib/server/in-memory-store";

export default function AdminDashboardPage() {
  const competitions = store.listCompetitions();
  const dashboard = store.getDashboard();
  const recentLogs = store.getLogs().slice(0, 8);

  return (
    <AdminShell
      title="Operations Dashboard"
      description="A fast operator view into live events, pending verification, spin outcomes, and payout workload."
    >
      <section className="stats">
        <StatCard label="Active Events" value={dashboard.activeEvents} hint="Currently live competitions" />
        <StatCard label="Participants" value={dashboard.totalParticipants} hint="Across active data" />
        <StatCard label="Pending Verification" value={dashboard.pendingVerification} hint="Needs moderator review" />
        <StatCard label="Unpaid Winners" value={dashboard.unpaidWinners} hint="Requires payout action" />
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
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
        <article className="card card-pad stack">
          <h2 className="section-title">Quick actions</h2>
          <a className="btn" href="/admin/competitions/new">Create competition</a>
          {competitions[0] && <a className="btn-secondary" href={`/admin/competitions/${competitions[0].id}/participants`}>Moderate participants</a>}
          {competitions[0] && <a className="btn-secondary" href={`/admin/competitions/${competitions[0].id}/live-control`}>Open live control</a>}
        </article>
      </section>
    </AdminShell>
  );
}
