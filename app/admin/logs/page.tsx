import { AdminShell } from "@/components/admin-shell";
import { formatDateTime } from "@/lib/format";
import { store } from "@/lib/server/in-memory-store";

export default function LogsPage() {
  const logs = store.getLogs();

  return (
    <AdminShell
      title="Audit Logs"
      description="Critical admin actions, duplicate flags, spin results, and payout status changes should all appear here."
    >
      <section className="card card-pad">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDateTime(log.createdAt)}</td>
                <td>{log.actor}</td>
                <td>{log.action}</td>
                <td>{log.entityType}</td>
                <td>{log.payloadSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
