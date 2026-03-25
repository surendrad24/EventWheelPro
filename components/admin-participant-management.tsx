"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPercent } from "@/lib/format";
import type { Participant } from "@/lib/types";
import { StatusChip } from "@/components/status-chip";
import { COUNTRIES } from "@/lib/countries";

type Props = {
  competitionId: string;
  competitionTitle: string;
  competitionOptions: Array<{ id: string; title: string }>;
  initialParticipants: Participant[];
  canEdit: boolean;
  canAdd: boolean;
};

type ImportRow = {
  displayName: string;
  exchangeNickname?: string;
  exchangeId?: string;
  walletAddress?: string;
  email?: string;
  xHandle?: string;
  phone?: string;
  telegramHandle?: string;
  country?: string;
};

function parseCsv(text: string): ImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());
  const rows: ImportRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split(",").map((value) => value.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    rows.push({
      displayName: row.displayName ?? row.name ?? "",
      exchangeNickname: row.exchangeNickname || undefined,
      exchangeId: row.exchangeId || undefined,
      walletAddress: row.walletAddress || undefined,
      email: row.email || undefined,
      xHandle: row.xHandle || row.twitterHandle || row.x || undefined,
      phone: row.phone || undefined,
      telegramHandle: row.telegramHandle || undefined,
      country: row.country || undefined
    });
  }

  return rows;
}

function downloadCsv(filename: string, rows: Participant[]) {
  const header = [
    "displayName",
    "exchangeNickname",
    "exchangeId",
    "walletAddress",
    "email",
    "xHandle",
    "phone",
    "telegramHandle",
    "country",
    "registrationStatus",
    "verificationStatus",
    "duplicateRiskScore",
    "joinedAt"
  ];
  const lines = rows.map((row) => [
    row.displayName,
    row.exchangeNickname ?? "",
    row.exchangeId ?? "",
    row.walletAddress ?? "",
    row.email ?? "",
    row.xHandle ?? "",
    row.phone ?? "",
    row.telegramHandle ?? "",
    row.country,
    row.registrationStatus,
    row.verificationStatus,
    String(row.duplicateRiskScore),
    row.joinedAt
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

function riskClass(score: number) {
  if (score >= 0.9) {
    return "chip risk-critical";
  }
  if (score >= 0.7) {
    return "chip risk-high";
  }
  if (score >= 0.4) {
    return "chip risk-medium";
  }
  return "chip risk-low";
}

export function AdminParticipantManagement({
  competitionId,
  competitionTitle,
  competitionOptions,
  initialParticipants,
  canEdit,
  canAdd
}: Props) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importCsv, setImportCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [addForm, setAddForm] = useState<ImportRow>({
    displayName: "",
    exchangeNickname: "",
    exchangeId: "",
    walletAddress: "",
    email: "",
    xHandle: "",
    phone: "",
    telegramHandle: "",
    country: "India"
  });

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, checked]) => checked).map(([id]) => id),
    [selected]
  );

  const filteredParticipants = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return participants.filter((participant) => {
      const matchesSearch = !normalized
        || participant.displayName.toLowerCase().includes(normalized)
        || (participant.exchangeId ?? "").toLowerCase().includes(normalized)
        || (participant.walletAddress ?? "").toLowerCase().includes(normalized)
        || (participant.email ?? "").toLowerCase().includes(normalized);

      const matchesStatus = statusFilter === "all" || participant.registrationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [participants, search, statusFilter]);

  async function refreshParticipants() {
    const response = await fetch(`/api/admin/competitions/${competitionId}/participants`, { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? "failed_to_load_participants");
    }
    setParticipants(body.participants ?? []);
  }

  async function updateSingle(participantId: string, action: "approve" | "reject") {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (action === "approve") {
        const response = await fetch(`/api/admin/participants/${participantId}/approve`, { method: "PATCH" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "approve_failed");
        }
      } else {
        const reason = window.prompt("Reason for rejection", "Manual moderation") ?? "Manual moderation";
        const response = await fetch(`/api/admin/participants/${participantId}/reject`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error ?? "reject_failed");
        }
      }

      await refreshParticipants();
      setMessage(`Participant ${action}d.`);
    } catch (actionError) {
      const text = actionError instanceof Error ? actionError.message : "request_failed";
      setError(`Action failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function runBulk(action: "approve" | "reject") {
    if (selectedIds.length === 0) {
      setError("Select participants first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const reason = action === "reject"
        ? (window.prompt("Reason for bulk rejection", "Bulk moderation") ?? "Bulk moderation")
        : undefined;

      const response = await fetch(`/api/admin/competitions/${competitionId}/participants/bulk`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, participantIds: selectedIds, reason })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "bulk_failed");
      }

      await refreshParticipants();
      setSelected({});
      setMessage(`Bulk ${action} complete. Updated: ${body.updated?.length ?? 0}.`);
    } catch (bulkError) {
      const text = bulkError instanceof Error ? bulkError.message : "bulk_failed";
      setError(`Bulk action failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const rows = parseCsv(importCsv);
      if (rows.length === 0) {
        throw new Error("no_valid_rows");
      }

      const response = await fetch(`/api/admin/competitions/${competitionId}/participants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participants: rows })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok && (body.created?.length ?? 0) === 0) {
        throw new Error(body.error ?? "import_failed");
      }

      await refreshParticipants();
      setImportCsv("");
      setMessage(`Import finished. Created ${body.created?.length ?? 0}, Errors ${body.errors?.length ?? 0}.`);
    } catch (importError) {
      const text = importError instanceof Error ? importError.message : "import_failed";
      setError(`Import failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  function onCsvFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImportCsv(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  async function onAddParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/participants`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addForm)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || (body.created?.length ?? 0) === 0) {
        throw new Error(body.error ?? body.errors?.[0]?.error ?? "create_failed");
      }

      await refreshParticipants();
      setAddForm({
        displayName: "",
        exchangeNickname: "",
        exchangeId: "",
        walletAddress: "",
        email: "",
        xHandle: "",
        phone: "",
        telegramHandle: "",
        country: "India"
      });
      setShowAddParticipant(false);
      setMessage("Participant added successfully.");
    } catch (addError) {
      const text = addError instanceof Error ? addError.message : "create_failed";
      setError(`Add participant failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 className="section-title">{competitionTitle}</h2>
          <div className="wrap">
            <button
              className="btn"
              type="button"
              disabled={!canAdd || loading}
              onClick={() => setShowAddParticipant((prev) => !prev)}
            >
              {showAddParticipant ? "Cancel" : "Add"}
            </button>
            <button className="btn-secondary" type="button" disabled={!canEdit || loading || selectedIds.length === 0} onClick={() => runBulk("approve")}>Bulk approve</button>
            <button className="btn-secondary" type="button" disabled={!canEdit || loading || selectedIds.length === 0} onClick={() => runBulk("reject")}>Bulk reject</button>
            <button className="btn" type="button" onClick={() => downloadCsv(`${competitionId}-participants.csv`, filteredParticipants)}>Export CSV</button>
          </div>
        </div>
        {!canAdd && <div className="list-item">Your role cannot add participants.</div>}
        {canAdd && showAddParticipant && (
          <form className="card card-pad stack" onSubmit={onAddParticipant}>
            <h3 className="section-title">Add Participant</h3>
            <div className="form-grid">
              <label className="field">
                <span>Display Name</span>
                <input
                  required
                  value={addForm.displayName}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, displayName: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Exchange Nickname</span>
                <input
                  value={addForm.exchangeNickname ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, exchangeNickname: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Exchange ID</span>
                <input
                  value={addForm.exchangeId ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, exchangeId: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Wallet Address</span>
                <input
                  value={addForm.walletAddress ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, walletAddress: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={addForm.email ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>X Handle</span>
                <input
                  value={addForm.xHandle ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, xHandle: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Phone</span>
                <input
                  value={addForm.phone ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Telegram</span>
                <input
                  value={addForm.telegramHandle ?? ""}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, telegramHandle: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Country</span>
                <select
                  value={addForm.country ?? "India"}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, country: event.target.value }))}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="wrap">
              <button className="btn" type="submit" disabled={loading}>Save Participant</button>
            </div>
          </form>
        )}

        <div className="form-grid">
          <label className="field">
            <span>Competition</span>
            <select
              value={competitionId}
              onChange={(event) => router.push(`/admin/competitions/${event.target.value}/participants`)}
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
              placeholder="Name, wallet, email, exchange ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Registration Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="registered">registered</option>
              <option value="pending_review">pending_review</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="flagged_duplicate">flagged_duplicate</option>
              <option value="removed">removed</option>
              <option value="won">won</option>
            </select>
          </label>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={filteredParticipants.length > 0 && filteredParticipants.every((p) => selected[p.id])}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelected((prev) => {
                      const next = { ...prev };
                      for (const participant of filteredParticipants) {
                        next[participant.id] = checked;
                      }
                      return next;
                    });
                  }}
                />
              </th>
              <th>Name</th>
              <th>Registration</th>
              <th>Verification</th>
              <th>Duplicate Risk</th>
              <th>Country</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map((participant) => (
              <tr key={participant.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!selected[participant.id]}
                    onChange={(event) => setSelected((prev) => ({ ...prev, [participant.id]: event.target.checked }))}
                  />
                </td>
                <td>
                  <strong>{participant.displayName}</strong>
                  <div className="muted">
                    {participant.exchangeId ?? "No exchange ID"} • {participant.walletAddress ?? "No wallet"} • {participant.xHandle ?? "No X handle"} • {participant.phone ?? "No phone"}
                  </div>
                </td>
                <td><StatusChip label={participant.registrationStatus} /></td>
                <td><StatusChip label={participant.verificationStatus} /></td>
                <td>
                  <span className={riskClass(participant.duplicateRiskScore)}>
                    {formatPercent(participant.duplicateRiskScore)}
                  </span>
                </td>
                <td>{participant.country}</td>
                <td>
                  <div className="wrap" style={{ justifyContent: "flex-end" }}>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => router.push(`/admin/competitions/${competitionId}/participants/${participant.id}`)}
                      disabled={!canEdit || loading}
                    >
                      Edit
                    </button>
                    <button className="btn-ghost" type="button" onClick={() => updateSingle(participant.id, "approve")} disabled={!canEdit || loading}>Approve</button>
                    <button className="btn-secondary" type="button" onClick={() => updateSingle(participant.id, "reject")} disabled={!canEdit || loading}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Import Participants</h2>
        {!canAdd && <div className="list-item">Your role cannot add participants.</div>}
        {canAdd && (
          <form className="stack" onSubmit={onImport}>
            <label className="field">
              <span>Upload CSV File</span>
              <input type="file" accept=".csv,text/csv" onChange={onCsvFileSelect} />
            </label>
            <label className="field">
              <span>CSV Content</span>
              <textarea
                value={importCsv}
                onChange={(event) => setImportCsv(event.target.value)}
                placeholder="displayName,exchangeNickname,exchangeId,walletAddress,email,xHandle,phone,telegramHandle,country"
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>Import CSV</button>
          </form>
        )}
      </section>

      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
