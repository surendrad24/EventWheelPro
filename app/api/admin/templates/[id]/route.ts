import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import {
  deleteCompetitionTemplate,
  getCompetitionTemplateById,
  updateCompetitionTemplate
} from "@/lib/server/admin-config-db";
import type { Competition } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const template = getCompetitionTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  }
  return NextResponse.json({ template });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const template = updateCompetitionTemplate(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      mode: body.mode === "quiz" ? "quiz" : body.mode === "wheel" ? "wheel" : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      defaultStatus: typeof body.defaultStatus === "string" ? body.defaultStatus as Competition["status"] : undefined,
      defaultThemeKey: typeof body.defaultThemeKey === "string" ? body.defaultThemeKey : undefined,
      defaultAnnouncementText: typeof body.defaultAnnouncementText === "string" ? body.defaultAnnouncementText : undefined,
      registrationFields: Array.isArray(body.registrationFields) ? body.registrationFields : undefined,
      prizeTiers: Array.isArray(body.prizeTiers) ? body.prizeTiers : undefined
    });
    if (!template) {
      return NextResponse.json({ error: "template_not_found" }, { status: 404 });
    }
    return NextResponse.json({ message: "template_updated", template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "template_update_failed";
    const status = message === "name_required" || message === "slug_required" || message === "slug_taken" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const { id } = await params;
  const deleted = deleteCompetitionTemplate(id);
  if (!deleted) {
    return NextResponse.json({ error: "template_not_found" }, { status: 404 });
  }
  return NextResponse.json({ message: "template_deleted" });
}
