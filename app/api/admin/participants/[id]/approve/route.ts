import { NextResponse } from "next/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({
    message: "Demo participant approved",
    participantId: id,
    registrationStatus: "approved",
    verificationStatus: "manual_override"
  });
}
