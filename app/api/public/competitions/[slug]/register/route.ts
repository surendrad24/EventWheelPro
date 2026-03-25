import { NextResponse } from "next/server";
import { getCompetitionBySlug } from "@/lib/mock-data";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));

  return NextResponse.json({
    message: "Demo registration accepted",
    competition: competition.slug,
    submission: body,
    registrationStatus: competition.verificationMode === "manual review" ? "pending_review" : "approved"
  });
}
