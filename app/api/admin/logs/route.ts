import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(request: Request) {
  const auth = requireAdminApiPermission(request, "logs", "view");
  if ("error" in auth) {
    return auth.error;
  }
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId") ?? undefined;
  return NextResponse.json({ logs: store.getLogs(competitionId) });
}
