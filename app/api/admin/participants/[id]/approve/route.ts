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
  const participant = store.approveParticipant(id);
  if (!participant) {
    return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
  }
  return NextResponse.json({
    message: "participant_approved",
    participant
  });
}
