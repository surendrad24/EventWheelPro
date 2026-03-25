import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminUserEditor } from "@/components/admin-user-editor";
import { requireAdminPagePermission } from "@/lib/server/admin-auth";
import { canAdminPerform } from "@/lib/server/auth-db";

function getCreatableRoles(actorRole: "super_admin" | "admin" | "moderator" | "finance") {
  if (actorRole === "super_admin") {
    return ["super_admin", "admin", "moderator", "finance"] as const;
  }
  if (actorRole === "admin") {
    return ["moderator", "finance"] as const;
  }
  return [] as const;
}

export default async function AdminCreateUserPage() {
  const admin = await requireAdminPagePermission("users", "add");
  if (getCreatableRoles(admin.role).length === 0) {
    redirect("/admin/users");
  }

  return (
    <AdminShell
      title="Create User"
      description="Create a new operator account with role and granular permissions."
    >
      <AdminUserEditor
        mode="create"
        currentRole={admin.role}
        currentAdminId={admin.id}
        canDeleteUsers={canAdminPerform(admin, "users", "delete")}
      />
    </AdminShell>
  );
}
