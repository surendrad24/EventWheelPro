"use client";

import { useEffect, useState } from "react";
import type { AdminDashboardStats } from "@/lib/server/dashboard-stats";

type Props = {
  initialStats: AdminDashboardStats;
};

function AdminStatCard({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <article className="card card-pad">
      <div className="eyebrow">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{hint}</div>
    </article>
  );
}

export function AdminDashboardStatsPanel({ initialStats }: Props) {
  const [stats, setStats] = useState<AdminDashboardStats>(initialStats);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/admin/dashboard?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { "cache-control": "no-store" }
        });
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as AdminDashboardStats;
        if (active) {
          setStats(body);
        }
      } catch {
        // Keep last successful stats if refresh fails.
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="stats">
      <AdminStatCard label="Active Events" value={stats.activeEvents} hint="Currently live competitions" />
      <AdminStatCard label="Participants" value={stats.totalParticipants} hint="Across active data" />
      <AdminStatCard label="Pending Verification" value={stats.pendingVerification} hint="Needs moderator review" />
      <AdminStatCard label="Unpaid Winners" value={stats.unpaidWinners} hint="Requires payout action" />
      <AdminStatCard label="Online Users" value={stats.onlineUsers} hint="Active admin sessions" />
      <AdminStatCard
        label="Server Usage"
        value={`${stats.serverUsagePct}%`}
        hint={`${stats.serverHealth} · Heap ${stats.heapUsedMb}/${stats.heapTotalMb} MB`}
      />
    </section>
  );
}
