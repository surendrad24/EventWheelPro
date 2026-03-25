import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "participants", "edit");
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "No reason supplied";
  const participant = store.rejectParticipant(id, reason);
  if (!participant) {
    return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "participant_rejected",
    participant
  });
}
