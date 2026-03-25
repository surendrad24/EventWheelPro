import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "add");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const competition = store.cloneCompetition(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    message: "competition_cloned",
    sourceCompetitionId: id,
    competition
  }, { status: 201 });
}
