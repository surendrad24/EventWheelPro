import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { getAdminDashboardStats } from "@/lib/server/dashboard-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = requireAdminApiPermission(request, "dashboard", "view");
  if ("error" in auth) {
    return auth.error;
  }
  return NextResponse.json(getAdminDashboardStats(), {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
