import { listAdminUsers } from "@/lib/server/auth-db";
import { store } from "@/lib/server/in-memory-store";

export type AdminDashboardStats = {
  activeEvents: number;
  totalParticipants: number;
  pendingVerification: number;
  unpaidWinners: number;
  onlineUsers: number;
  heapUsedMb: number;
  heapTotalMb: number;
  serverUsagePct: number;
  serverHealth: "Healthy" | "Warning" | "Critical";
};

export function getAdminDashboardStats(): AdminDashboardStats {
  const dashboard = store.getDashboard();
  const onlineUsers = listAdminUsers().filter((user) => user.isActive && user.isOnline).length;
  const heapUsedMb = Math.round(process.memoryUsage().heapUsed / (1024 * 1024));
  const heapTotalMb = Math.max(1, Math.round(process.memoryUsage().heapTotal / (1024 * 1024)));
  const serverUsagePct = Math.min(100, Math.round((heapUsedMb / heapTotalMb) * 100));
  const serverHealth = serverUsagePct >= 90 ? "Critical" : serverUsagePct >= 75 ? "Warning" : "Healthy";

  return {
    ...dashboard,
    onlineUsers,
    heapUsedMb,
    heapTotalMb,
    serverUsagePct,
    serverHealth
  };
}
