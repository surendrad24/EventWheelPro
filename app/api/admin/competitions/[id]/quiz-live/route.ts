import { NextResponse } from "next/server";
import { buildQuizPlayback } from "@/lib/quiz-playback";
import { requireAdminApiPermission } from "@/lib/server/admin-auth";
import { store } from "@/lib/server/in-memory-store";

type ActionBody = {
  action?: "start" | "pause" | "resume" | "next" | "prev" | "reset";
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "live_control", "view");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const competition = store.getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
  }

  const questions = store.listQuizQuestions(id);
  const liveState = store.getQuizLiveState(id);
  const playback = buildQuizPlayback(questions, competition.eventStartAt, liveState);

  return NextResponse.json({
    competitionId: id,
    liveState,
    playback
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdminApiPermission(request, "live_control", "edit");
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as ActionBody;
  const action = body.action;
  if (!action || !["start", "pause", "resume", "next", "prev", "reset"].includes(action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  try {
    const liveState = store.setQuizLiveAction(id, action);
    const competition = store.getCompetitionById(id);
    if (!competition) {
      return NextResponse.json({ error: "competition_not_found" }, { status: 404 });
    }
    const questions = store.listQuizQuestions(id);
    const playback = buildQuizPlayback(questions, competition.eventStartAt, liveState);

    return NextResponse.json({
      message: `quiz_live_${action}`,
      competitionId: id,
      liveState,
      playback
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "quiz_live_action_failed";
    const status = message === "competition_not_found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
