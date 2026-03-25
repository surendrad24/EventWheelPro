import { NextResponse } from "next/server";
import { getCompetitionParticipants } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ participants: getCompetitionParticipants(id) });
}
