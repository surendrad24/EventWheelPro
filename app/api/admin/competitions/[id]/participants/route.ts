import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }
  return NextResponse.json({ participants: store.getParticipants(id) });
}
