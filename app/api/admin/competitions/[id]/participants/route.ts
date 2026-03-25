import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin", "moderator"]);
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
