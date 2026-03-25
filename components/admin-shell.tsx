import Link from "next/link";
import { ReactNode } from "react";
import { store } from "@/lib/server/in-memory-store";

const firstCompetitionId = store.listCompetitions()[0]?.id ?? "comp-1";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: `/admin/competitions/${firstCompetitionId}/participants`, label: "Participants" },
  { href: `/admin/competitions/${firstCompetitionId}/live-control`, label: "Live Control" },
  { href: `/admin/competitions/${firstCompetitionId}/winners`, label: "Winners" },
  { href: `/admin/competitions/${firstCompetitionId}/payouts`, label: "Payouts" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/templates", label: "Templates" }
];

export function AdminShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="page shell sidebar-layout">
      <aside className="card admin-nav">
        <div className="stack">
          <div>
            <div className="eyebrow">Operator Console</div>
            <strong>Event Wheel Pro</strong>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {navItems.map((item) => (
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
