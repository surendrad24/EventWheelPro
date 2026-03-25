"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ClaimStatus, PayoutStatus, Winner } from "@/lib/types";
import { StatusChip } from "@/components/status-chip";

type Props = {
  competitionId: string;
  competitionTitle: string;
  competitionOptions: Array<{ id: string; title: string }>;
  initialWinners: Winner[];
  canEditClaim: boolean;
  canEditPayout: boolean;
};

const CLAIM_STATUS_OPTIONS: ClaimStatus[] = ["not_applicable", "pending", "submitted", "verified", "expired"];
const PAYOUT_STATUS_OPTIONS: PayoutStatus[] = ["not_applicable", "pending", "processing", "paid", "failed"];

function downloadCsv(filename: string, rows: Winner[]) {
  const header = [
    "displayName",
    "participantId",
    "prizeLabel",
    "roundNumber",
    "claimStatus",
    "payoutStatus",
    "transactionReference",
    "wonAt",
    "claimDeadlineAt",
    "claimedAt",
    "verifiedAt",
    "paidAt"
  ];

  const lines = rows.map((row) => [
    row.displayName,
    row.participantId,
    row.prizeLabel,
    String(row.roundNumber),
    row.claimStatus,
    row.payoutStatus,
    row.transactionReference ?? "",
    row.wonAt,
    row.claimDeadlineAt,
    row.claimedAt ?? "",
    row.verifiedAt ?? "",
    row.paidAt ?? ""
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

export function AdminWinnersManagement({
  competitionId,
  competitionTitle,
  competitionOptions,
  initialWinners,
  canEditClaim,
  canEditPayout
}: Props) {
  const router = useRouter();
  const [winners, setWinners] = useState<Winner[]>(initialWinners);
  const [search, setSearch] = useState("");
  const [claimFilter, setClaimFilter] = useState("all");
  const [payoutFilter, setPayoutFilter] = useState("all");
  const [referenceDrafts, setReferenceDrafts] = useState<Record<string, string>>(
    Object.fromEntries(initialWinners.map((winner) => [winner.id, winner.transactionReference ?? ""]))
  );
  const [savingWinnerId, setSavingWinnerId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredWinners = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return winners.filter((winner) => {
      const matchesSearch = !normalized
        || winner.displayName.toLowerCase().includes(normalized)
        || winner.participantId.toLowerCase().includes(normalized)
        || (winner.transactionReference ?? "").toLowerCase().includes(normalized);
      const matchesClaim = claimFilter === "all" || winner.claimStatus === claimFilter;
      const matchesPayout = payoutFilter === "all" || winner.payoutStatus === payoutFilter;
      return matchesSearch && matchesClaim && matchesPayout;
    });
  }, [winners, search, claimFilter, payoutFilter]);

  function applyWinnerUpdate(updatedWinner: Winner) {
    setWinners((current) => current.map((winner) => (winner.id === updatedWinner.id ? updatedWinner : winner)));
    setReferenceDrafts((current) => ({
      ...current,
      [updatedWinner.id]: updatedWinner.transactionReference ?? current[updatedWinner.id] ?? ""
    }));
  }

  async function updateClaimStatus(winnerId: string, claimStatus: ClaimStatus) {
    if (!canEditClaim) {
      return;
    }
    setSavingWinnerId(winnerId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/winners/${winnerId}/claim-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ claimStatus })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "claim_update_failed");
      }
      applyWinnerUpdate(body.winner as Winner);
      setMessage("Claim status updated.");
    } catch (claimError) {
      const text = claimError instanceof Error ? claimError.message : "claim_update_failed";
      setError(`Unable to update claim status: ${text}`);
    } finally {
      setSavingWinnerId(null);
    }
  }

  async function updatePayoutStatus(winnerId: string, payoutStatus: PayoutStatus) {
    if (!canEditPayout) {
      return;
    }
    setSavingWinnerId(winnerId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/winners/${winnerId}/payout-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payoutStatus,
          transactionReference: referenceDrafts[winnerId] ?? ""
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "payout_update_failed");
      }
      applyWinnerUpdate(body.winner as Winner);
      setMessage("Payout status updated.");
    } catch (payoutError) {
      const text = payoutError instanceof Error ? payoutError.message : "payout_update_failed";
      setError(`Unable to update payout status: ${text}`);
    } finally {
      setSavingWinnerId(null);
    }
  }

  async function saveReference(winnerId: string) {
    if (!canEditPayout) {
      return;
    }
    const winner = winners.find((entry) => entry.id === winnerId);
    if (!winner) {
      return;
    }
    setSavingWinnerId(winnerId);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/winners/${winnerId}/payout-status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payoutStatus: winner.payoutStatus,
          transactionReference: referenceDrafts[winnerId] ?? ""
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "reference_update_failed");
      }
      applyWinnerUpdate(body.winner as Winner);
      setMessage("Transaction reference saved.");
    } catch (referenceError) {
      const text = referenceError instanceof Error ? referenceError.message : "reference_update_failed";
      setError(`Unable to save reference: ${text}`);
    } finally {
      setSavingWinnerId(null);
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
              onClick={() => downloadCsv(`${competitionId}-winners.csv`, filteredWinners)}
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Competition</span>
            <select
              className="matrix-neon-select"
              value={competitionId}
              onChange={(event) => router.push(`/admin/competitions/${event.target.value}/winners`)}
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
              placeholder="Winner name, participant ID, transaction reference"
            />
          </label>
          <label className="field">
            <span>Claim Status</span>
            <select className="matrix-neon-select" value={claimFilter} onChange={(event) => setClaimFilter(event.target.value)}>
              <option value="all">All</option>
              {CLAIM_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Payout Status</span>
            <select className="matrix-neon-select" value={payoutFilter} onChange={(event) => setPayoutFilter(event.target.value)}>
              <option value="all">All</option>
              {PAYOUT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Winner</th>
              <th>Prize</th>
              <th>Won At</th>
              <th>Claim</th>
              <th>Payout</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredWinners.map((winner) => (
              <tr key={winner.id}>
                <td>
                  <strong>{winner.displayName}</strong>
                  <div className="muted">Round {winner.roundNumber} • {winner.participantId}</div>
                </td>
                <td>{winner.prizeLabel}</td>
                <td>{formatDateTime(winner.wonAt)}<div className="muted">Deadline {formatDate(winner.claimDeadlineAt)}</div></td>
                <td>
                  <div className="stack">
                    <StatusChip label={winner.claimStatus} />
                    <select
                      className="matrix-neon-select"
                      value={winner.claimStatus}
                      onChange={(event) => updateClaimStatus(winner.id, event.target.value as ClaimStatus)}
                      disabled={!canEditClaim || savingWinnerId === winner.id}
                    >
                      {CLAIM_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="stack">
                    <StatusChip label={winner.payoutStatus} />
                    <select
                      className="matrix-neon-select"
                      value={winner.payoutStatus}
                      onChange={(event) => updatePayoutStatus(winner.id, event.target.value as PayoutStatus)}
                      disabled={!canEditPayout || savingWinnerId === winner.id}
                    >
                      {PAYOUT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <div className="wrap">
                    <input
                      value={referenceDrafts[winner.id] ?? ""}
                      placeholder="tx hash / payout note"
                      onChange={(event) => setReferenceDrafts((current) => ({
                        ...current,
                        [winner.id]: event.target.value
                      }))}
                      disabled={!canEditPayout || savingWinnerId === winner.id}
                    />
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => saveReference(winner.id)}
                      disabled={!canEditPayout || savingWinnerId === winner.id}
                    >
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredWinners.length === 0 && <div className="list-item">No winners found for current filters.</div>}
      </section>
      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
