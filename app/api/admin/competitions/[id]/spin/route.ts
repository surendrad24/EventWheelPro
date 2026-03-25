import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin", "moderator"]);
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const initiatedBy = typeof body.initiatedBy === "string" ? body.initiatedBy : "admin";
  const clientSeed = typeof body.clientSeed === "string" ? body.clientSeed : undefined;
  const result = store.createSpin(id, initiatedBy, clientSeed);

  if ("error" in result) {
    const status = result.error === "competition_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "spin_completed",
    competitionId: id,
    rngMode: result.spin.rngMode,
    spin: result.spin,
    winner: result.winner,
    participant: result.participant,
    fairness: result.fairness
  });
}
