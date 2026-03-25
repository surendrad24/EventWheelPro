import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateCreateForm } from "@/components/admin-template-create-form";
import { requireAdminPageRole } from "@/lib/server/admin-auth";

export default async function NewTemplatePage() {
  await requireAdminPageRole(["super_admin"]);

  return (
    <AdminShell
      title="Create Template"
      description="Define a reusable competition blueprint and save it for quick launches."
    >
      <AdminTemplateCreateForm />
    </AdminShell>
  );
}
