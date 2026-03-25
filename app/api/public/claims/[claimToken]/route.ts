import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ claimToken: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const { claimToken } = await params;

  return NextResponse.json({
    message: "Demo claim submitted",
    claimToken,
    claimStatus: "submitted",
    payload: body
  });
}
