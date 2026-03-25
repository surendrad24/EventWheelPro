import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const participant = store.approveParticipant(id);
  if (!participant) {
    return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
  }
  return NextResponse.json({
    message: "participant_approved",
    participant
  });
}
