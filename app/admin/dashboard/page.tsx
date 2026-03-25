import { AdminShell } from "@/components/admin-shell";
import { StatCard } from "@/components/stat-card";
import { competitions, eventLogs, participants, winners } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="Operations Dashboard"
      description="A fast operator view into live events, pending verification, spin outcomes, and payout workload."
    >
      <section className="stats">
        <StatCard label="Active Events" value={competitions.filter((item) => item.status === "live").length} hint="Currently live competitions" />
        <StatCard label="Participants" value={participants.length} hint="Across seeded MVP data" />
        <StatCard label="Pending Verification" value={participants.filter((item) => item.verificationStatus === "pending").length} hint="Needs moderator review" />
        <StatCard label="Unpaid Winners" value={winners.filter((item) => item.payoutStatus !== "paid").length} hint="Requires payout action" />
      </section>

      <section className="grid" style={{ gridTemplateColumns: "1.2fr 0.8fr" }}>
        <article className="card card-pad stack">
          <div className="row-between">
            <h2 className="section-title">Recent logs</h2>
            <a className="btn-secondary" href="/admin/logs">View all</a>
          </div>
          {eventLogs.map((log) => (
            <div key={log.id} className="list-item">
              <strong>{log.action}</strong>
              <div className="muted">{log.payloadSummary}</div>
            </div>
          ))}
        </article>
        <article className="card card-pad stack">
          <h2 className="section-title">Quick actions</h2>
          <a className="btn" href="/admin/competitions/new">Create competition</a>
          <a className="btn-secondary" href="/admin/competitions/comp-1/participants">Moderate participants</a>
          <a className="btn-secondary" href="/admin/competitions/comp-1/live-control">Open live control</a>
        </article>
      </section>
    </AdminShell>
  );
}
