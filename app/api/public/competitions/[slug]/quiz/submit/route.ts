import { NextResponse } from "next/server";
import { store } from "@/lib/server/in-memory-store";

type SubmitBody = {
  questionId?: string;
  selectedIndex?: number;
  displayName?: string;
  exchangeId?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = store.getCompetitionBySlug(slug);

  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as SubmitBody;
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const selectedIndex = typeof body.selectedIndex === "number" ? body.selectedIndex : -1;

  const result = store.submitQuizAnswer(competition.id, {
    questionId,
    selectedIndex,
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    exchangeId: typeof body.exchangeId === "string" ? body.exchangeId : undefined
  });

  if ("error" in result) {
    const status = result.error === "competition_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    message: "quiz_answer_submitted",
    ...result
  }, { status: 201 });
}
