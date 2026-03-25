import { NextResponse } from "next/server";
import { getCompetitionBySlug, getCompetitionParticipants } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  return NextResponse.json({
    participants: getCompetitionParticipants(competition.id)
  });
}
