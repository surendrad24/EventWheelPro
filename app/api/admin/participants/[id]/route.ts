import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";
import type { Participant } from "@/lib/types";

type Body = {
  displayName?: string;
  exchangeNickname?: string;
  exchangeId?: string;
  walletAddress?: string;
  email?: string;
  xHandle?: string;
  phone?: string;
  telegramHandle?: string;
  country?: string;
  registrationStatus?: Participant["registrationStatus"];
  verificationStatus?: Participant["verificationStatus"];
  duplicateRiskScore?: number;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "participants", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Body;

  try {
    const participant = store.updateParticipant(id, {
      displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      exchangeNickname: typeof body.exchangeNickname === "string" ? body.exchangeNickname : undefined,
      exchangeId: typeof body.exchangeId === "string" ? body.exchangeId : undefined,
      walletAddress: typeof body.walletAddress === "string" ? body.walletAddress : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      xHandle: typeof body.xHandle === "string" ? body.xHandle : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      telegramHandle: typeof body.telegramHandle === "string" ? body.telegramHandle : undefined,
      country: typeof body.country === "string" ? body.country : undefined,
      registrationStatus: body.registrationStatus,
      verificationStatus: body.verificationStatus,
      duplicateRiskScore: typeof body.duplicateRiskScore === "number" ? body.duplicateRiskScore : undefined
    });

    if (!participant) {
      return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
    }

    return NextResponse.json({ message: "participant_updated", participant });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status =
      message === "display_name_required" ||
      message === "duplicate_wallet" ||
      message === "duplicate_exchange_id"
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "participants", "delete");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const participant = store.deleteParticipant(id);
  if (!participant) {
    return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
  }

  return NextResponse.json({ message: "participant_deleted", participant });
}
