import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "live_control", "view");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    competitionId: id,
    fairnessRecords: store.listSpinFairnessRecords(id)
  });
}
