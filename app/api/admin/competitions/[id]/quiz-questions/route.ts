import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";
import type { QuizQuestionType } from "@/lib/types";

type CreateQuizQuestionBody = {
  prompt?: string;
  questionType?: QuizQuestionType;
  options?: string[];
  answerIndex?: number;
  durationSeconds?: number;
  order?: number;
};

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

  return NextResponse.json({
    competitionId: id,
    questions: store.listQuizQuestions(id)
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as CreateQuizQuestionBody;

  try {
    const question = store.createQuizQuestion(id, {
      prompt: typeof body.prompt === "string" ? body.prompt : "",
      questionType: body.questionType === "question_only" ? "question_only" : "multiple_choice",
      options: Array.isArray(body.options) ? body.options.map((entry) => String(entry)) : [],
      answerIndex: typeof body.answerIndex === "number" ? body.answerIndex : undefined,
      durationSeconds: typeof body.durationSeconds === "number" ? body.durationSeconds : undefined,
      order: typeof body.order === "number" ? body.order : undefined
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed_to_create_quiz_question";
    const status = message === "competition_not_found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
