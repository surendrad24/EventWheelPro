"use client";

import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/format";
import type { EventLog } from "@/lib/types";

function downloadCsv(filename: string, rows: EventLog[]) {
  const header = ["createdAt", "actor", "action", "entityType", "entityId", "competitionId", "payloadSummary"];
  const lines = rows.map((row) => [
    row.createdAt,
    row.actor,
    row.action,
    row.entityType,
    row.entityId,
    row.competitionId ?? "",
    row.payloadSummary
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

export function AdminLogsPanel({
  initialLogs,
  competitionOptions
}: {
  initialLogs: EventLog[];
  competitionOptions: Array<{ id: string; title: string }>;
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [competitionId, setCompetitionId] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return logs.filter((entry) => {
      const matchesSearch = !normalized
        || entry.actor.toLowerCase().includes(normalized)
        || entry.action.toLowerCase().includes(normalized)
        || entry.payloadSummary.toLowerCase().includes(normalized);
      const matchesAction = actionFilter === "all" || entry.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(logs.map((entry) => entry.action))).sort();
  }, [logs]);

  async function reloadForCompetition(nextCompetitionId: string) {
    setLoading(true);
    setError(null);
    try {
      const url = nextCompetitionId === "all"
        ? "/api/admin/logs"
        : `/api/admin/logs?competitionId=${encodeURIComponent(nextCompetitionId)}`;
      const response = await fetch(url, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "logs_load_failed");
      }
      setLogs(body.logs ?? []);
      setCompetitionId(nextCompetitionId);
      setActionFilter("all");
    } catch (loadError) {
      const text = loadError instanceof Error ? loadError.message : "logs_load_failed";
      setError(`Unable to load logs: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card card-pad stack">
      <div className="row-between">
        <h2 className="section-title">Audit Trail</h2>
        <button className="btn" type="button" onClick={() => downloadCsv(`audit-logs-${Date.now()}.csv`, filtered)}>
          Export CSV
        </button>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Competition</span>
          <select
            value={competitionId}
            onChange={(event) => reloadForCompetition(event.target.value)}
            disabled={loading}
          >
            <option value="all">All competitions</option>
            {competitionOptions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title} ({competition.id})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Action</span>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
            <option value="all">All actions</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Actor, action, or summary"
          />
        </label>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Competition</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>{log.actor}</td>
              <td>{log.action}</td>
              <td>{log.entityType}:{log.entityId}</td>
              <td>{log.competitionId ?? "-"}</td>
              <td>{log.payloadSummary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <div className="list-item">No logs found for current filters.</div>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </section>
  );
}
