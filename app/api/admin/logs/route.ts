import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(request: Request) {
  const auth = requireAdminApiAuth(request);
  if ("error" in auth) {
    return auth.error;
  }
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get("competitionId") ?? undefined;
  return NextResponse.json({ logs: store.getLogs(competitionId) });
}
