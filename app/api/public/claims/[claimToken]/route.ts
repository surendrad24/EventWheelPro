import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ claimToken: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const { claimToken } = await params;
  const result = store.submitClaim(claimToken, body);
  if (!result) {
    return NextResponse.json({ error: "claim_target_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "claim_submitted",
    claimToken,
    claimStatus: result.winner.claimStatus,
    winner: result.winner
  });
}
