import { NextResponse } from "next/server";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";
import type { QuizQuestionType } from "@/lib/types";

type PatchBody = {
  prompt?: string;
  questionType?: QuizQuestionType;
  options?: string[];
  answerIndex?: number;
  durationSeconds?: number;
  order?: number;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { questionId } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;

  try {
    const question = store.updateQuizQuestion(questionId, {
      prompt: typeof body.prompt === "string" ? body.prompt : undefined,
      questionType: body.questionType === "question_only" ? "question_only" : body.questionType === "multiple_choice" ? "multiple_choice" : undefined,
      options: Array.isArray(body.options) ? body.options.map((entry) => String(entry)) : undefined,
      answerIndex: typeof body.answerIndex === "number" ? body.answerIndex : undefined,
      durationSeconds: typeof body.durationSeconds === "number" ? body.durationSeconds : undefined,
      order: typeof body.order === "number" ? body.order : undefined
    });

    if (!question) {
      return NextResponse.json({ error: "quiz_question_not_found" }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed_to_update_quiz_question";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const auth = requireAdminApiPermission(request, "competitions", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { questionId } = await params;
  const deleted = store.deleteQuizQuestion(questionId);
  if (!deleted) {
    return NextResponse.json({ error: "quiz_question_not_found" }, { status: 404 });
  }

  return NextResponse.json({ message: "quiz_question_deleted", questionId });
}
