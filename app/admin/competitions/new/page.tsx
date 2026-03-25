import { AdminShell } from "@/components/admin-shell";
import { CompetitionEditorForm } from "@/components/competition-editor-form";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";

export default async function NewCompetitionPage() {
  await requireAdminPagePermission("competitions", "add");

  return (
    <AdminShell
      title="Create Competition"
      description="The page structure follows the PRD’s operator builder: basic info, theme, registration fields, verification, prizes, schedule, and publish review."
    >
      <CompetitionEditorForm mode="create" />
    </AdminShell>
  );
}
