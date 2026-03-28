import type { QuizLiveState, QuizQuestion } from "@/lib/types";

export type QuizPlaybackStatus = "empty" | "scheduled" | "live" | "completed";

export type QuizQuestionPublic = Omit<QuizQuestion, "answerIndex"> & { answerIndex?: never };

export type QuizPlayback = {
  status: QuizPlaybackStatus;
  activeIndex: number;
  totalQuestions: number;
  currentQuestion: QuizQuestionPublic | null;
  timeRemainingSeconds: number;
  nextQuestionAt?: string;
  controlMode: "auto" | "manual";
};

function sanitizeQuestion(question: QuizQuestion): QuizQuestionPublic {
  return {
    id: question.id,
    competitionId: question.competitionId,
    prompt: question.prompt,
    questionType: question.questionType,
    options: question.options,
    durationSeconds: question.durationSeconds,
    order: question.order,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

export function buildQuizPlayback(
  questionsInput: QuizQuestion[],
  eventStartAt: string,
  liveState?: QuizLiveState | null,
  nowMs = Date.now()
): QuizPlayback {
  const questions = [...questionsInput].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));

  if (!questions.length) {
    return {
      status: "empty",
      activeIndex: -1,
      totalQuestions: 0,
      currentQuestion: null,
      timeRemainingSeconds: 0,
      controlMode: liveState ? "manual" : "auto"
    };
  }

  if (liveState) {
    const index = Math.min(Math.max(0, liveState.currentIndex), questions.length - 1);
    const duration = Math.max(5, Math.floor(questions[index].durationSeconds || 20));

    if (liveState.status === "stopped") {
      return {
        status: "scheduled",
        activeIndex: index,
        totalQuestions: questions.length,
        currentQuestion: sanitizeQuestion(questions[index]),
        timeRemainingSeconds: duration,
        controlMode: "manual"
      };
    }

    if (liveState.status === "paused") {
      const remaining = Math.max(
        0,
        Math.min(duration, Math.floor(liveState.pausedRemainingSeconds ?? duration))
      );
      return {
        status: "live",
        activeIndex: index,
        totalQuestions: questions.length,
        currentQuestion: sanitizeQuestion(questions[index]),
        timeRemainingSeconds: remaining,
        controlMode: "manual"
      };
    }

    const startedMs = liveState.questionStartedAt ? new Date(liveState.questionStartedAt).getTime() : nowMs;
    let elapsed = Math.max(0, Math.floor((nowMs - startedMs) / 1000));
    let activeIndex = index;
    let activeDuration = duration;
    let runningStartedMs = startedMs;

    while (elapsed >= activeDuration && activeIndex < questions.length - 1) {
      elapsed -= activeDuration;
      runningStartedMs += activeDuration * 1000;
      activeIndex += 1;
      activeDuration = Math.max(5, Math.floor(questions[activeIndex].durationSeconds || 20));
    }

    const remaining = Math.max(0, activeDuration - elapsed);
    return {
      status: "live",
      activeIndex,
      totalQuestions: questions.length,
      currentQuestion: sanitizeQuestion(questions[activeIndex]),
      timeRemainingSeconds: remaining,
      nextQuestionAt: new Date(runningStartedMs + activeDuration * 1000).toISOString(),
      controlMode: "manual"
    };
  }

  const startMs = new Date(eventStartAt).getTime();
  if (!Number.isFinite(startMs)) {
    return {
      status: "scheduled",
      activeIndex: 0,
      totalQuestions: questions.length,
      currentQuestion: sanitizeQuestion(questions[0]),
      timeRemainingSeconds: 0,
      controlMode: "auto"
    };
  }

  if (nowMs < startMs) {
    return {
      status: "scheduled",
      activeIndex: 0,
      totalQuestions: questions.length,
      currentQuestion: sanitizeQuestion(questions[0]),
      timeRemainingSeconds: Math.max(0, Math.ceil((startMs - nowMs) / 1000)),
      nextQuestionAt: new Date(startMs).toISOString(),
      controlMode: "auto"
    };
  }

  const elapsedSeconds = Math.floor((nowMs - startMs) / 1000);
  let cursor = 0;
  let activeIndex = questions.length - 1;
  let nextQuestionAt: string | undefined;
  let timeRemainingSeconds = 0;
  let status: QuizPlaybackStatus = "completed";

  for (let index = 0; index < questions.length; index += 1) {
    const duration = Math.max(5, Math.floor(questions[index].durationSeconds || 20));
    const segmentEnd = cursor + duration;
    if (elapsedSeconds < segmentEnd) {
      activeIndex = index;
      timeRemainingSeconds = Math.max(0, segmentEnd - elapsedSeconds);
      nextQuestionAt = new Date(startMs + segmentEnd * 1000).toISOString();
      status = "live";
      break;
    }
    cursor = segmentEnd;
  }

  return {
    status,
    activeIndex,
    totalQuestions: questions.length,
    currentQuestion: sanitizeQuestion(questions[activeIndex]),
    timeRemainingSeconds,
    nextQuestionAt,
    controlMode: "auto"
  };
}
