import { AdminShell } from "@/components/admin-shell";
import { AdminLogsPanel } from "@/components/admin-logs-panel";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export default async function LogsPage() {
  await requireAdminPagePermission("logs", "view");
  const logs = store.getLogs();
  const competitions = store.listCompetitions();

  return (
    <AdminShell
      title="Audit Logs"
      description="Critical admin actions, duplicate flags, spin results, and payout status changes should all appear here."
    >
      <AdminLogsPanel
        initialLogs={logs}
        competitionOptions={competitions.map((competition) => ({
          id: competition.id,
          title: competition.title
        }))}
      />
    </AdminShell>
  );
}
