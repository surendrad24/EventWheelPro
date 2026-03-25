import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "view");
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }
  return NextResponse.json({ competition });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "edit");
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const payload = await request.json().catch(() => ({}));
  try {
    const competition = store.patchCompetition(id, payload);
    if (!competition) {
      return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
    }
    return NextResponse.json({ competition });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "slug_taken" || message === "title_required" || message === "slug_required" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "delete");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const deleted = store.deleteCompetition(id);
  if (!deleted) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  return NextResponse.json({ message: "competition_deleted" });
}
