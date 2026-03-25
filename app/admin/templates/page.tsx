import { AdminShell } from "@/components/admin-shell";
import { AdminTemplatesPanel } from "@/components/admin-templates-panel";
import { requireAdminPageRole } from "@/lib/server/admin-auth";
import { listCompetitionTemplates } from "@/lib/server/admin-config-db";

export default async function TemplatesPage() {
  await requireAdminPageRole(["super_admin"]);
  const templates = listCompetitionTemplates();

  return (
    <AdminShell
      title="Templates"
      description="Reusable event blueprints help operators launch future competitions without starting from scratch."
    >
      <AdminTemplatesPanel initialTemplates={templates} />
    </AdminShell>
  );
}
