import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = store.createSpin(id, typeof body.initiatedBy === "string" ? body.initiatedBy : "admin");

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
    participant: result.participant
  });
}
