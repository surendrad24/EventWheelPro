import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";
import type { Winner } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const validPayoutStatuses: Winner["payoutStatus"][] = ["not_applicable", "pending", "processing", "paid", "failed"];
  const nextStatus = validPayoutStatuses.includes(body.payoutStatus)
    ? body.payoutStatus
    : "processing";
  const reference = typeof body.transactionReference === "string" ? body.transactionReference : undefined;
  const winner = store.updateWinnerPayoutStatus(id, nextStatus, reference);
  if (!winner) {
    return NextResponse.json({ error: "winner_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "payout_status_updated",
    winner
  });
}
