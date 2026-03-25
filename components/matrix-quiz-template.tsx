"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Competition, Participant, Winner } from "@/lib/types";

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
};

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What does BSC stand for?",
    options: ["Binance Smart Chain", "Bitcoin Secure Chain", "Blockchain Storage Core", "Basic Swap Contract"],
    answerIndex: 0
  },
  {
    id: "q2",
    prompt: "A wallet private key should be:",
    options: ["Shared with moderators", "Kept secret", "Stored in public bio", "Posted for verification"],
    answerIndex: 1
  },
  {
    id: "q3",
    prompt: "Which status means registration is accepted?",
    options: ["pending_review", "flagged_duplicate", "approved", "rejected"],
    answerIndex: 2
  }
];

export function MatrixQuizTemplate({
  competition,
  participants,
  winners
}: {
  competition: Competition;
  participants: Participant[];
  winners: Winner[];
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(45);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[roundIndex];

  useEffect(() => {
    setRemainingSeconds(45);
    setSelectedAnswer(null);
    setSubmitted(false);
  }, [roundIndex]);

  useEffect(() => {
    if (submitted) {
      return;
    }
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  const sortedLeaderboard = useMemo(() => {
    return [...participants].sort((a, b) => b.wins - a.wins || a.displayName.localeCompare(b.displayName));
  }, [participants]);

  const accuracyLabel = useMemo(() => {
    if (!submitted || selectedAnswer === null) {
      return null;
    }
    return selectedAnswer === currentQuestion.answerIndex ? "Correct answer" : "Try next round";
  }, [submitted, selectedAnswer, currentQuestion.answerIndex]);

  return (
    <div className="matrix-quiz-shell">
      <section className="matrix-page-head matrix-heroes-head">
        <div className="eyebrow">{competition.title}</div>
        <h1 className="title-lg">Quiz Arena</h1>
        <p>{competition.announcementText || "Answer each round before time runs out."}</p>
      </section>

      <section className="matrix-quiz-metrics">
        <article>
          <strong>{participants.length}</strong>
          <span>Participants</span>
        </article>
        <article>
          <strong>{winners.length}</strong>
          <span>Total Winners</span>
        </article>
        <article>
          <strong>{roundIndex + 1}/{SAMPLE_QUESTIONS.length}</strong>
          <span>Round</span>
        </article>
      </section>

      <section className="matrix-quiz-grid">
        <article className="matrix-quiz-card">
          <div className="matrix-quiz-card-head">
            <h2>Question Round {roundIndex + 1}</h2>
            <div className="matrix-quiz-timer">{remainingSeconds}s</div>
          </div>
          <p className="matrix-quiz-prompt">{currentQuestion.prompt}</p>
          <div className="matrix-quiz-options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`matrix-quiz-option ${selectedAnswer === index ? "active" : ""}`}
                onClick={() => !submitted && setSelectedAnswer(index)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="matrix-quiz-actions">
            <button
              className="matrix-wheel-cta-primary"
              type="button"
              disabled={selectedAnswer === null || submitted}
              onClick={() => setSubmitted(true)}
            >
              Submit Answer
            </button>
            <button
              className="matrix-wheel-cta-secondary"
              type="button"
              disabled={roundIndex >= SAMPLE_QUESTIONS.length - 1}
              onClick={() => setRoundIndex((value) => Math.min(value + 1, SAMPLE_QUESTIONS.length - 1))}
            >
              Next Round
            </button>
            <Link className="matrix-wheel-cta-secondary" href={`/competitions/${competition.slug}/leaderboard`}>
              View Leaderboard
            </Link>
          </div>
          {accuracyLabel ? <p className="matrix-quiz-feedback">{accuracyLabel}</p> : null}
        </article>

        <aside className="matrix-quiz-card">
          <h2>Live Scoreboard</h2>
          <div className="matrix-quiz-leaderboard">
            {sortedLeaderboard.slice(0, 12).map((participant, index) => (
              <div key={participant.id} className="matrix-quiz-rank-row">
                <span>#{index + 1}</span>
                <strong>{participant.displayName}</strong>
                <em>{participant.wins} wins</em>
              </div>
            ))}
          </div>
          <div className="matrix-quiz-foot-links">
            <Link href={`/competitions/${competition.slug}`}>Competition Home</Link>
            <Link href={`/competitions/${competition.slug}/winners`}>Winner History</Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
