import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin", "moderator", "finance"]);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const fairness = store.getSpinFairnessRecord(id);
  if (!fairness) {
    return NextResponse.json({ error: "spin_fairness_not_found" }, { status: 404 });
  }
  return NextResponse.json({ fairness });
}
