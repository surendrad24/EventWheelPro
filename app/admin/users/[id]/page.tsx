import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminUserEditor } from "@/components/admin-user-editor";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform, getAdminUserById } from "@/lib/server/auth-db";
import type { AdminRole } from "@/lib/permissions";

function canManageTarget(actorRole: AdminRole, targetRole: AdminRole) {
  if (actorRole === "super_admin") {
    return true;
  }
  if (actorRole === "admin") {
    return targetRole === "moderator" || targetRole === "finance";
  }
  return false;
}

export default async function AdminEditUserPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPagePermission("users", "edit");
  const { id } = await params;
  const user = getAdminUserById(id);
  if (!user) {
    notFound();
  }
  if (!canManageTarget(admin.role, user.role)) {
    redirect("/admin/users");
  }

  return (
    <AdminShell
      title="Edit User"
      description="Update role, profile details, status, password, and granular permissions."
    >
      <AdminUserEditor
        mode="edit"
        currentRole={admin.role}
        currentAdminId={admin.id}
        canDeleteUsers={canAdminPerform(admin, "users", "delete")}
        initialUser={user}
      />
    </AdminShell>
  );
}
