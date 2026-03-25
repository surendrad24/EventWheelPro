import { AdminShell } from "@/components/admin-shell";
import { requireAdminPageRole } from "@/lib/server/admin-auth";

export default async function SettingsPage() {
  await requireAdminPageRole(["super_admin"]);

  return (
    <AdminShell
      title="Platform Settings"
      description="Global settings for admin roles, token verification providers, secrets, and platform-wide defaults."
    >
      <section className="card card-pad stack">
        <div className="list-item">Admin RBAC and optional 2FA configuration</div>
        <div className="list-item">RPC provider and token verification settings</div>
        <div className="list-item">Notification channels, retry policy, and webhook secret management</div>
      </section>
    </AdminShell>
  );
}
