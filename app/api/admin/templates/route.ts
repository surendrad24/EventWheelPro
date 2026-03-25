import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { createCompetitionTemplate, listCompetitionTemplates } from "@/lib/server/admin-config-db";
import type { Competition } from "@/lib/types";

export async function GET(request: Request) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  return NextResponse.json({ templates: listCompetitionTemplates() });
}

export async function POST(request: Request) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const body = await request.json().catch(() => ({}));
  try {
    const template = createCompetitionTemplate({
      name: String(body.name ?? ""),
      slug: typeof body.slug === "string" ? body.slug : undefined,
      mode: body.mode === "quiz" ? "quiz" : "wheel",
      description: typeof body.description === "string" ? body.description : undefined,
      defaultStatus: typeof body.defaultStatus === "string" ? body.defaultStatus as Competition["status"] : undefined,
      defaultThemeKey: typeof body.defaultThemeKey === "string" ? body.defaultThemeKey : undefined,
      defaultAnnouncementText: typeof body.defaultAnnouncementText === "string" ? body.defaultAnnouncementText : undefined,
      registrationFields: Array.isArray(body.registrationFields) ? body.registrationFields : undefined,
      prizeTiers: Array.isArray(body.prizeTiers) ? body.prizeTiers : undefined
    });
    return NextResponse.json({ message: "template_created", template }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "template_create_failed";
    const status = message === "name_required" || message === "slug_required" || message === "slug_taken" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
