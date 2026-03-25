import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const result = store.registerBySlug(slug, body);

  if ("error" in result) {
    const status =
      result.error === "competition_not_found"
        ? 404
        : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  const competition = store.getCompetitionBySlug(slug);

  return NextResponse.json({
    message: "registration_accepted",
    competition: competition?.slug ?? slug,
    participant: result.participant,
    registrationStatus: result.participant.registrationStatus
  }, { status: 201 });
}
