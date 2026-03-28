import { NextResponse } from "next/server";
import { buildQuizPlayback } from "@/lib/quiz-playback";
import { store } from "@/lib/server/in-memory-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const competition = store.getCompetitionBySlug(slug);

  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const questions = store.listQuizQuestions(competition.id, { includeAnswers: false });
  const liveState = store.getQuizLiveState(competition.id);
  const playback = buildQuizPlayback(questions, competition.eventStartAt, liveState);

  return NextResponse.json({
    quiz: {
      ...playback,
      liveState,
      eventStartAt: competition.eventStartAt,
      now: new Date().toISOString()
    }
  });
}
