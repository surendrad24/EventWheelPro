import Link from "next/link";
import { ReactNode } from "react";
import { requireAdminPageAuth } from "@/lib/server/admin-auth";
import type { AdminRole } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

const firstCompetitionId = store.listCompetitions()[0]?.id ?? "comp-1";

const navItems: Array<{ href: string; label: string; roles?: AdminRole[] }> = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: `/admin/competitions/${firstCompetitionId}/participants`, label: "Participants", roles: ["super_admin", "moderator"] },
  { href: `/admin/competitions/${firstCompetitionId}/live-control`, label: "Live Control", roles: ["super_admin", "moderator"] },
  { href: `/admin/competitions/${firstCompetitionId}/winners`, label: "Winners" },
  { href: `/admin/competitions/${firstCompetitionId}/payouts`, label: "Payouts", roles: ["super_admin", "finance"] },
  { href: "/admin/settings", label: "Settings", roles: ["super_admin"] },
  { href: "/admin/logs", label: "Logs" },
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

  return (
    <div className="page shell sidebar-layout">
      <aside className="card admin-nav">
        <div className="stack">
          <div>
            <div className="eyebrow">Operator Console</div>
            <strong>Event Wheel Pro</strong>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{admin.email}</div>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {navItems
              .filter((item) => !item.roles || item.roles.includes(admin.role))
              .map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
              ))}
          </div>
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
