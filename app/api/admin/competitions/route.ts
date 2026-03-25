import { NextResponse } from "next/server";
import { requireAdminApiAuth } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

export async function GET(request: Request) {
  const auth = requireAdminApiAuth(request);
  if ("error" in auth) {
    return auth.error;
  }
  return NextResponse.json({ competitions: store.listCompetitions() });
}

export async function POST(request: Request) {
  const auth = requireAdminApiAuth(request, ["super_admin"]);
  if ("error" in auth) {
    return auth.error;
  }
  const body = await request.json().catch(() => ({}));
  try {
    const competition = store.createCompetition(body);
    return NextResponse.json({ competition }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_payload";
    const status = message === "title_required" || message === "slug_taken" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
