import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    message: "Demo payout status updated",
    winnerId: id,
    payoutStatus: body.payoutStatus ?? "processing",
    transactionReference: body.transactionReference ?? null
  });
}
