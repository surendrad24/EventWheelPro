import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { createCompetitionFromTemplate } from "@/lib/server/admin-config-db";
import type { Competition } from "@/lib/types";

export async function POST(
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
    const competition = createCompetitionFromTemplate(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      status: typeof body.status === "string" ? body.status as Competition["status"] : undefined,
      registrationOpenAt: typeof body.registrationOpenAt === "string" ? body.registrationOpenAt : undefined,
      registrationCloseAt: typeof body.registrationCloseAt === "string" ? body.registrationCloseAt : undefined,
      eventStartAt: typeof body.eventStartAt === "string" ? body.eventStartAt : undefined,
      eventEndAt: typeof body.eventEndAt === "string" ? body.eventEndAt : undefined
    });
    return NextResponse.json({ message: "competition_created_from_template", competition }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "template_apply_failed";
    const status = message === "template_not_found" || message === "slug_taken" || message === "title_required" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
