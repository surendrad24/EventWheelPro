import { AdminShell } from "@/components/admin-shell";
import { AdminSettingsPanel } from "@/components/admin-settings-panel";
import { requireAdminPageRole } from "@/lib/server/admin-auth";
import { getPlatformSettings } from "@/lib/server/admin-config-db";

export default async function SettingsPage() {
  await requireAdminPageRole(["super_admin"]);
  const settings = getPlatformSettings();

  return (
    <AdminShell
      title="Platform Settings"
      description="Global settings for admin roles, token verification providers, secrets, and platform-wide defaults."
    >
      <AdminSettingsPanel initialSettings={settings} />
    </AdminShell>
  );
}
