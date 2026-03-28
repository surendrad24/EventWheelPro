"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizQuestion, QuizQuestionType } from "@/lib/types";

type Props = {
  competitionId: string;
  competitionTitle: string;
  competitionOptions: Array<{ id: string; title: string }>;
  initialQuestions: QuizQuestion[];
};

type QuestionDraft = {
  prompt: string;
  questionType: QuizQuestionType;
  options: string[];
  answerIndex: number;
  durationSeconds: number;
  order: number;
};

function toDraft(question: QuizQuestion): QuestionDraft {
  const options = question.options.length ? question.options : ["", "", "", ""];
  return {
    prompt: question.prompt,
    questionType: question.questionType,
    options,
    answerIndex: question.answerIndex ?? 0,
    durationSeconds: question.durationSeconds,
    order: question.order
  };
}

function normalizeOptions(options: string[]) {
  return options.map((entry) => entry.trim()).filter(Boolean).slice(0, 8);
}

export function AdminQuizQuestionsPanel({
  competitionId,
  competitionTitle,
  competitionOptions,
  initialQuestions
}: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>(
    Object.fromEntries(initialQuestions.map((question) => [question.id, toDraft(question)]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState<QuestionDraft>({
    prompt: "",
    questionType: "multiple_choice",
    options: ["", "", "", ""],
    answerIndex: 0,
    durationSeconds: 20,
    order: (initialQuestions[0]?.order ?? 0) + initialQuestions.length + 1
  });

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)),
    [questions]
  );

  async function refreshQuestions() {
    const response = await fetch(`/api/admin/competitions/${competitionId}/quiz-questions`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? "failed_to_load_questions");
    }
    const incoming = (body.questions ?? []) as QuizQuestion[];
    setQuestions(incoming);
    setDrafts(Object.fromEntries(incoming.map((question) => [question.id, toDraft(question)])));
  }

  async function createQuestion() {
    setSavingId("new");
    setMessage(null);
    setError(null);
    try {
      const payload = {
        prompt: createDraft.prompt,
        questionType: createDraft.questionType,
        options: createDraft.questionType === "multiple_choice" ? normalizeOptions(createDraft.options) : [],
        answerIndex: createDraft.answerIndex,
        durationSeconds: createDraft.durationSeconds,
        order: createDraft.order
      };
      const response = await fetch(`/api/admin/competitions/${competitionId}/quiz-questions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "create_failed");
      }
      await refreshQuestions();
      setCreateDraft((prev) => ({
        ...prev,
        prompt: "",
        options: ["", "", "", ""],
        order: prev.order + 1
      }));
      setMessage("Question added.");
    } catch (createError) {
      const text = createError instanceof Error ? createError.message : "create_failed";
      setError(`Unable to create question: ${text}`);
    } finally {
      setSavingId(null);
    }
  }

  async function saveQuestion(questionId: string) {
    const draft = drafts[questionId];
    if (!draft) {
      return;
    }
    setSavingId(questionId);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        prompt: draft.prompt,
        questionType: draft.questionType,
        options: draft.questionType === "multiple_choice" ? normalizeOptions(draft.options) : [],
        answerIndex: draft.answerIndex,
        durationSeconds: draft.durationSeconds,
        order: draft.order
      };
      const response = await fetch(`/api/admin/quiz-questions/${questionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "update_failed");
      }
      await refreshQuestions();
      setMessage("Question saved.");
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : "update_failed";
      setError(`Unable to save question: ${text}`);
    } finally {
      setSavingId(null);
    }
  }

  async function deleteQuestion(questionId: string) {
    const confirmDelete = window.confirm("Delete this quiz question?");
    if (!confirmDelete) {
      return;
    }

    setSavingId(questionId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/quiz-questions/${questionId}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }
      await refreshQuestions();
      setMessage("Question deleted.");
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : "delete_failed";
      setError(`Unable to delete question: ${text}`);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section-title">{competitionTitle}</h2>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Competition</span>
            <select
              className="matrix-neon-select"
              value={competitionId}
              onChange={(event) => router.push(`/admin/competitions/${event.target.value}/quiz-questions`)}
            >
              {competitionOptions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.title} ({competition.id})
                </option>
              ))}
            </select>
          </label>
        </div>

        {message ? <div className="status success">{message}</div> : null}
        {error ? <div className="status error">{error}</div> : null}
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Add Question</h2>
        <div className="form-grid">
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            <span>Question Prompt</span>
            <textarea
              value={createDraft.prompt}
              rows={3}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, prompt: event.target.value }))}
              placeholder="Enter the question shown on stream"
            />
          </label>
          <label className="field">
            <span>Question Type</span>
            <select
              className="matrix-neon-select"
              value={createDraft.questionType}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, questionType: event.target.value as QuizQuestionType }))}
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="question_only">Question Only</option>
            </select>
          </label>
          <label className="field">
            <span>Duration (seconds)</span>
            <input
              type="number"
              min={5}
              max={600}
              value={createDraft.durationSeconds}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, durationSeconds: Number(event.target.value) || 20 }))}
            />
          </label>
          <label className="field">
            <span>Order</span>
            <input
              type="number"
              min={1}
              value={createDraft.order}
              onChange={(event) => setCreateDraft((prev) => ({ ...prev, order: Number(event.target.value) || 1 }))}
            />
          </label>

          {createDraft.questionType === "multiple_choice" ? (
            <>
              {createDraft.options.map((option, index) => (
                <label key={`new-${index}`} className="field">
                  <span>Option {index + 1}</span>
                  <input
                    value={option}
                    onChange={(event) => {
                      const nextOptions = [...createDraft.options];
                      nextOptions[index] = event.target.value;
                      setCreateDraft((prev) => ({ ...prev, options: nextOptions }));
                    }}
                  />
                </label>
              ))}
              <label className="field">
                <span>Correct Option</span>
                <select
                  className="matrix-neon-select"
                  value={createDraft.answerIndex}
                  onChange={(event) => setCreateDraft((prev) => ({ ...prev, answerIndex: Number(event.target.value) }))}
                >
                  {createDraft.options.map((_, index) => (
                    <option key={index} value={index}>Option {index + 1}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>
        <div className="wrap">
          <button className="btn" type="button" onClick={createQuestion} disabled={savingId === "new"}>
            {savingId === "new" ? "Adding..." : "Add Question"}
          </button>
        </div>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Question Bank</h2>
        {!sortedQuestions.length ? <div className="muted">No quiz questions yet.</div> : null}
        {sortedQuestions.map((question) => {
          const draft = drafts[question.id] ?? toDraft(question);
          const isSaving = savingId === question.id;
          return (
            <article key={question.id} className="list-item stack">
              <div className="form-grid">
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Prompt</span>
                  <textarea
                    rows={2}
                    value={draft.prompt}
                    onChange={(event) => setDrafts((prev) => ({ ...prev, [question.id]: { ...draft, prompt: event.target.value } }))}
                  />
                </label>
                <label className="field">
                  <span>Type</span>
                  <select
                    className="matrix-neon-select"
                    value={draft.questionType}
                    onChange={(event) => setDrafts((prev) => ({
                      ...prev,
                      [question.id]: { ...draft, questionType: event.target.value as QuizQuestionType }
                    }))}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="question_only">Question Only</option>
                  </select>
                </label>
                <label className="field">
                  <span>Duration (seconds)</span>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    value={draft.durationSeconds}
                    onChange={(event) => setDrafts((prev) => ({
                      ...prev,
                      [question.id]: { ...draft, durationSeconds: Number(event.target.value) || 20 }
                    }))}
                  />
                </label>
                <label className="field">
                  <span>Order</span>
                  <input
                    type="number"
                    min={1}
                    value={draft.order}
                    onChange={(event) => setDrafts((prev) => ({
                      ...prev,
                      [question.id]: { ...draft, order: Number(event.target.value) || 1 }
                    }))}
                  />
                </label>

                {draft.questionType === "multiple_choice" ? (
                  <>
                    {draft.options.map((option, index) => (
                      <label key={`${question.id}-${index}`} className="field">
                        <span>Option {index + 1}</span>
                        <input
                          value={option}
                          onChange={(event) => {
                            const nextOptions = [...draft.options];
                            nextOptions[index] = event.target.value;
                            setDrafts((prev) => ({ ...prev, [question.id]: { ...draft, options: nextOptions } }));
                          }}
                        />
                      </label>
                    ))}
                    <label className="field">
                      <span>Correct Option</span>
                      <select
                        className="matrix-neon-select"
                        value={draft.answerIndex}
                        onChange={(event) => setDrafts((prev) => ({
                          ...prev,
                          [question.id]: { ...draft, answerIndex: Number(event.target.value) }
                        }))}
                      >
                        {draft.options.map((_, index) => (
                          <option key={index} value={index}>Option {index + 1}</option>
                        ))}
                      </select>
                    </label>
                  </>
                ) : null}
              </div>

              <div className="wrap">
                <button className="btn" type="button" onClick={() => saveQuestion(question.id)} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button className="btn-ghost" type="button" onClick={() => deleteQuestion(question.id)} disabled={isSaving}>
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
