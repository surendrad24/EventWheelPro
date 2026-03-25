import { AdminShell } from "@/components/admin-shell";
import { AdminUsersList } from "@/components/admin-users-list";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform, listAdminUsers } from "@/lib/server/auth-db";

export default async function AdminUsersPage() {
  const admin = await requireAdminPagePermission("users", "view");
  const users = listAdminUsers();

  return (
    <AdminShell
      title="User Management"
      description="Create and manage super admin, admin, moderator, and finance users with granular feature permissions."
    >
      <AdminUsersList
        currentAdminId={admin.id}
        currentRole={admin.role}
        canAddUsers={canAdminPerform(admin, "users", "add")}
        canDeleteUsers={canAdminPerform(admin, "users", "delete")}
        initialUsers={users}
      />
    </AdminShell>
  );
}
