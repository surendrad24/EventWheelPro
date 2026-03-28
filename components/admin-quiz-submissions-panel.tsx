"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";
import type { QuizQuestion, QuizSubmission } from "@/lib/types";

type Props = {
  competitionId: string;
  competitionTitle: string;
  competitionOptions: Array<{ id: string; title: string }>;
  initialSubmissions: QuizSubmission[];
  questions: QuizQuestion[];
};

function downloadCsv(filename: string, rows: QuizSubmission[]) {
  const header = [
    "submittedAt",
    "questionPrompt",
    "displayName",
    "exchangeId",
    "selectedIndex",
    "isCorrect"
  ];

  const lines = rows.map((row) => [
    row.submittedAt,
    row.questionPrompt,
    row.displayName ?? "",
    row.exchangeId ?? "",
    String(row.selectedIndex),
    row.isCorrect ? "YES" : "NO"
  ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));

  const csv = `${header.join(",")}\n${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AdminQuizSubmissionsPanel({
  competitionId,
  competitionTitle,
  competitionOptions,
  initialSubmissions,
  questions
}: Props) {
  const router = useRouter();
  const [submissions] = useState<QuizSubmission[]>(initialSubmissions);
  const [search, setSearch] = useState("");
  const [questionFilter, setQuestionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const filterKey = `${search}|${questionFilter}|${resultFilter}|${dateFrom}|${dateTo}`;
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return submissions.filter((entry) => {
      const submittedMs = new Date(entry.submittedAt).getTime();
      const matchesSearch = !q
        || (entry.displayName ?? "").toLowerCase().includes(q)
        || (entry.exchangeId ?? "").toLowerCase().includes(q)
        || entry.questionPrompt.toLowerCase().includes(q);

      const matchesQuestion = questionFilter === "all" || entry.questionId === questionFilter;
      const matchesResult = resultFilter === "all"
        || (resultFilter === "correct" && entry.isCorrect)
        || (resultFilter === "wrong" && !entry.isCorrect);

      const matchesDateFrom = fromMs === null || submittedMs >= fromMs;
      const matchesDateTo = toMs === null || submittedMs <= toMs;

      return matchesSearch && matchesQuestion && matchesResult && matchesDateFrom && matchesDateTo;
    });
  }, [submissions, search, questionFilter, resultFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section-title">{competitionTitle}</h2>
          <button
            className="btn"
            type="button"
            onClick={() => downloadCsv(`${competitionId}-quiz-submissions.csv`, filtered)}
          >
            Export CSV
          </button>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Competition</span>
            <select
              className="matrix-neon-select"
              value={competitionId}
              onChange={(event) => router.push(`/admin/competitions/${event.target.value}/quiz-submissions`)}
            >
              {competitionOptions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.title} ({competition.id})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, Binance ID, question"
            />
          </label>
          <label className="field">
            <span>Question</span>
            <select className="matrix-neon-select" value={questionFilter} onChange={(event) => setQuestionFilter(event.target.value)}>
              <option value="all">All</option>
              {questions.map((question) => (
                <option key={question.id} value={question.id}>
                  Q{question.order}: {question.prompt.slice(0, 42)}{question.prompt.length > 42 ? "..." : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Result</span>
            <select className="matrix-neon-select" value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="correct">Correct</option>
              <option value="wrong">Wrong</option>
            </select>
          </label>
          <label className="field">
            <span>Date From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="field">
            <span>Date To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="field">
            <span>Page Size</span>
            <select
              className="matrix-neon-select"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card card-pad stack">
        <div className="row-between">
          <h2 className="section-title">Quiz Submissions</h2>
          <div className="muted">Showing {paged.length} of {filtered.length}</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Question</th>
              <th>Name</th>
              <th>Binance ID</th>
              <th>Selected</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {!paged.length ? (
              <tr>
                <td colSpan={6} className="muted">No submissions found.</td>
              </tr>
            ) : paged.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDateTime(entry.submittedAt)}</td>
                <td>{entry.questionPrompt}</td>
                <td>{entry.displayName ?? "N/A"}</td>
                <td>{entry.exchangeId ?? "N/A"}</td>
                <td>Option {entry.selectedIndex + 1}</td>
                <td>{entry.isCorrect ? "YES" : "NO"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="wrap">
          <button
            type="button"
            className="btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </button>
          <span className="muted">Page {currentPage} / {totalPages}</span>
          <button
            type="button"
            className="btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
