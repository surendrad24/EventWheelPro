import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = store.getCompetitionBySlug(slug);

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  return NextResponse.json({
    participants: store.getParticipants(competition.id)
  });
}
