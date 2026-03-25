import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";
import type { Winner } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const validClaimStatuses: Winner["claimStatus"][] = ["not_applicable", "pending", "submitted", "verified", "expired"];
  const nextStatus = validClaimStatuses.includes(body.claimStatus)
    ? body.claimStatus
    : "submitted";
  const winner = store.updateWinnerClaimStatus(id, nextStatus);
  if (!winner) {
    return NextResponse.json({ error: "winner_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "claim_status_updated",
    winner
  });
}
