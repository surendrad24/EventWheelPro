import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "participants", "view");
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }
  return NextResponse.json({ participants: store.getParticipants(id) });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "participants", "add");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({} as {
    participants?: Array<Record<string, unknown>>;
    displayName?: string;
    exchangeNickname?: string;
    exchangeId?: string;
    walletAddress?: string;
    email?: string;
    xHandle?: string;
    phone?: string;
    telegramHandle?: string;
    country?: string;
  }));

  const entries = Array.isArray(body.participants)
    ? body.participants
    : [body];

  const created = [];
  const errors: Array<{ index: number; error: string }> = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const result = store.registerForCompetitionId(id, {
      displayName: String(entry.displayName ?? ""),
      exchangeNickname: typeof entry.exchangeNickname === "string" ? entry.exchangeNickname : undefined,
      exchangeId: typeof entry.exchangeId === "string" ? entry.exchangeId : undefined,
      walletAddress: typeof entry.walletAddress === "string" ? entry.walletAddress : undefined,
      email: typeof entry.email === "string" ? entry.email : undefined,
      xHandle: typeof entry.xHandle === "string" ? entry.xHandle : undefined,
      phone: typeof entry.phone === "string" ? entry.phone : undefined,
      telegramHandle: typeof entry.telegramHandle === "string" ? entry.telegramHandle : undefined,
      country: typeof entry.country === "string" ? entry.country : undefined
    });

    if ("error" in result) {
      errors.push({ index, error: String(result.error) });
      continue;
    }
    created.push(result.participant);
  }

  return NextResponse.json({
    competitionId: id,
    created,
    errors
  }, { status: created.length > 0 ? 201 : 400 });
}
