import { AdminProfilePanel } from "@/components/admin-profile-panel";
import { AdminShell } from "@/components/admin-shell";
import { requireAdminPageAuth } from "@/lib/server/admin-auth";

export default async function AdminProfilePage() {
  const admin = await requireAdminPageAuth();

  return (
    <AdminShell
      title="My Profile"
      description="Update your identity details, contact information, profile image, and account password."
    >
      <AdminProfilePanel
        initialProfile={{
          id: admin.id,
          email: admin.email,
          role: admin.role,
          name: admin.name,
          phone: admin.phone,
          address: admin.address,
          profileImageUrl: admin.profileImageUrl
        }}
      />
    </AdminShell>
  );
}
