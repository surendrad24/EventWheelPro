import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = store.getCompetitionBySlug(slug);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const initiatedBy = typeof body.initiatedBy === "string" ? body.initiatedBy : "public-ui";
  const clientSeed = typeof body.clientSeed === "string" ? body.clientSeed : undefined;
  const result = store.createSpin(competition.id, initiatedBy, clientSeed);

  if ("error" in result) {
    const status = result.error === "competition_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "spin_completed",
    competitionId: competition.id,
    spin: result.spin,
    winner: result.winner,
    participant: result.participant
  });
}
