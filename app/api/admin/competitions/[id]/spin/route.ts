import { NextResponse } from "next/server";
import { getCompetitionParticipants } from "@/lib/mock-data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pool = getCompetitionParticipants(id).filter((participant) => participant.registrationStatus === "approved");
  const winner = pool[0];

  return NextResponse.json({
    message: "Demo spin complete",
    competitionId: id,
    rngMode: "server-seeded RNG",
    winner
  });
}
