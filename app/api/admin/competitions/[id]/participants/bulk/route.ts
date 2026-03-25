import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

type BulkBody = {
  action?: "approve" | "reject";
  participantIds?: string[];
  reason?: string;
};

export async function PATCH(request: Request) {
  const auth = requireAdminApiPermission(request, "participants", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => ({}))) as BulkBody;
  const action = body.action;
  const participantIds = Array.isArray(body.participantIds) ? body.participantIds.filter(Boolean) : [];

  if ((action !== "approve" && action !== "reject") || participantIds.length === 0) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const updated = [];
  const missing: string[] = [];
  const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : "No reason supplied";

  for (const participantId of participantIds) {
    const nextParticipant = action === "approve"
      ? store.approveParticipant(participantId)
      : store.rejectParticipant(participantId, reason);

    if (!nextParticipant) {
      missing.push(participantId);
      continue;
    }
    updated.push(nextParticipant);
  }

  return NextResponse.json({
    message: `participants_${action}d`,
    updated,
    missing
  });
}
