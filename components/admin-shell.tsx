import Link from "next/link";
import { ReactNode } from "react";
import { requireAdminPageAuth } from "@/lib/server/admin-auth";
import { AdminFeature, AdminRole, PermissionAction } from "@/lib/permissions";
import { canAdminPerform } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";
import { MatrixRainBackground } from "@/components/matrix-rain-background";

const firstCompetitionId = store.listCompetitions()[0]?.id ?? "comp-1";

const navItems: Array<{
  href: string;
  label: string;
  roles?: AdminRole[];
  permission?: { feature: AdminFeature; action: PermissionAction };
}> = [
  { href: "/admin/dashboard", label: "Dashboard", permission: { feature: "dashboard", action: "view" } },
  { href: "/admin/competitions", label: "Competitions", permission: { feature: "competitions", action: "view" } },
  { href: `/admin/competitions/${firstCompetitionId}/participants`, label: "Participants", permission: { feature: "participants", action: "view" } },
  { href: `/admin/competitions/${firstCompetitionId}/live-control`, label: "Live Control", permission: { feature: "live_control", action: "view" } },
  { href: `/admin/competitions/${firstCompetitionId}/winners`, label: "Winners", permission: { feature: "participants", action: "view" } },
  { href: `/admin/competitions/${firstCompetitionId}/payouts`, label: "Payouts", permission: { feature: "payouts", action: "view" } },
  { href: "/admin/users", label: "Users", permission: { feature: "users", action: "view" } },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/settings", label: "Settings", roles: ["super_admin"] },
  { href: "/admin/logs", label: "Logs", permission: { feature: "logs", action: "view" } },
  { href: "/admin/templates", label: "Templates", roles: ["super_admin"] }
];

export async function AdminShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const admin = await requireAdminPageAuth();
  const displayInitial = (admin.name?.trim()?.[0] ?? admin.email[0] ?? "A").toUpperCase();
  const displayName = admin.name?.trim() || admin.email.split("@")[0];

  return (
    <div className="admin-matrix page shell sidebar-layout">
      <MatrixRainBackground className="admin-rain" />
      <aside className="card admin-nav">
        <div className="stack">
          <div>
            <div className="admin-avatar-wrap">
              {admin.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={admin.profileImageUrl} alt={admin.name ?? admin.email} className="admin-avatar" />
              ) : (
                <div className="admin-avatar admin-avatar-fallback">{displayInitial}</div>
              )}
            </div>
            <div className="admin-display-name">{displayName}</div>
            <div className="eyebrow">Admin Console</div>
            <strong className="admin-brand">FUSION MATRIX</strong>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{admin.email}</div>
            <div className="chip" style={{ marginTop: 8 }}>{admin.role.replaceAll("_", " ")}</div>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {navItems
              .filter((item) => (!item.roles || item.roles.includes(admin.role)))
              .filter((item) => (!item.permission || canAdminPerform(admin, item.permission.feature, item.permission.action)))
              .map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
              ))}
          </div>
          <form action="/api/admin/auth/logout" method="post">
            <button type="submit" className="btn-ghost" style={{ width: "100%" }}>Sign out</button>
          </form>
        </div>
      </aside>
      <main className="stack">
        <section className="card card-pad">
          <div className="eyebrow">Admin Portal</div>
          <h1 className="title-lg">{title}</h1>
          <p className="muted">{description}</p>
        </section>
        {children}
      </main>
    </div>
  );
}
