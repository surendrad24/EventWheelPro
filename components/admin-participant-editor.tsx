"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";
import type { Participant } from "@/lib/types";

type EditForm = {
  displayName: string;
  exchangeNickname: string;
  exchangeId: string;
  walletAddress: string;
  email: string;
  xHandle: string;
  phone: string;
  telegramHandle: string;
  country: string;
  registrationStatus: Participant["registrationStatus"];
  verificationStatus: Participant["verificationStatus"];
  duplicateRiskScore: number;
};

type FieldKey = keyof EditForm;

const REGISTRATION_STATUSES: Participant["registrationStatus"][] = [
  "registered",
  "pending_review",
  "approved",
  "rejected",
  "flagged_duplicate",
  "removed",
  "won"
];

const VERIFICATION_STATUSES: Participant["verificationStatus"][] = [
  "not_required",
  "pending",
  "passed",
  "failed",
  "manual_override"
];

export function AdminParticipantEditor({
  competitionId,
  participant,
  canDelete
}: {
  competitionId: string;
  participant: Participant;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [savedFields, setSavedFields] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [form, setForm] = useState<EditForm>({
    displayName: participant.displayName,
    exchangeNickname: participant.exchangeNickname ?? "",
    exchangeId: participant.exchangeId ?? "",
    walletAddress: participant.walletAddress ?? "",
    email: participant.email ?? "",
    xHandle: participant.xHandle ?? "",
    phone: participant.phone ?? "",
    telegramHandle: participant.telegramHandle ?? "",
    country: participant.country,
    registrationStatus: participant.registrationStatus,
    verificationStatus: participant.verificationStatus,
    duplicateRiskScore: participant.duplicateRiskScore
  });

  function markChanged(field: FieldKey) {
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
    setSavedFields((prev) => ({ ...prev, [field]: false }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function indicator(field: FieldKey) {
    if (loading && dirtyFields[field]) {
      return <span style={{ color: "#ffd15d", fontSize: 12 }}>saving...</span>;
    }
    if (fieldErrors[field]) {
      return <span style={{ color: "#ff6f9e", fontSize: 12 }}>{fieldErrors[field]}</span>;
    }
    if (savedFields[field]) {
      return <span style={{ color: "#49ff71", fontSize: 12 }}>saved</span>;
    }
    if (dirtyFields[field]) {
      return <span style={{ color: "#ffd15d", fontSize: 12 }}>edited</span>;
    }
    return null;
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(`/api/admin/participants/${participant.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "update_failed");
      }
      const changed = Object.entries(dirtyFields)
        .filter(([, value]) => value)
        .map(([key]) => key as FieldKey);
      const nextSaved: Partial<Record<FieldKey, boolean>> = {};
      changed.forEach((field) => {
        nextSaved[field] = true;
      });
      setSavedFields((prev) => ({ ...prev, ...nextSaved }));
      setDirtyFields({});
      setMessage("Participant updated.");
      router.refresh();
    } catch (saveError) {
      const text = saveError instanceof Error ? saveError.message : "update_failed";
      if (text === "display_name_required") {
        setFieldErrors((prev) => ({ ...prev, displayName: "required" }));
      }
      if (text === "duplicate_wallet") {
        setFieldErrors((prev) => ({ ...prev, walletAddress: "duplicate wallet" }));
      }
      if (text === "duplicate_exchange_id") {
        setFieldErrors((prev) => ({ ...prev, exchangeId: "duplicate exchange ID" }));
      }
      setError(`Update failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!canDelete) {
      return;
    }
    const confirmed = window.confirm("Delete this participant?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/participants/${participant.id}`, {
        method: "DELETE"
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }

      router.push(`/admin/competitions/${competitionId}/participants`);
      router.refresh();
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : "delete_failed";
      setError(`Delete failed: ${text}`);
      setLoading(false);
    }
  }

  return (
    <section className="card card-pad stack">
      <h2 className="section-title">Edit Participant</h2>
      <form className="stack" onSubmit={onSave}>
        <div className="form-grid">
          <label className="field">
            <span>Display Name {indicator("displayName")}</span>
            <input
              value={form.displayName}
              onChange={(event) => {
                markChanged("displayName");
                setForm((prev) => ({ ...prev, displayName: event.target.value }));
              }}
              required
            />
          </label>
          <label className="field">
            <span>Exchange Nickname {indicator("exchangeNickname")}</span>
            <input
              value={form.exchangeNickname}
              onChange={(event) => {
                markChanged("exchangeNickname");
                setForm((prev) => ({ ...prev, exchangeNickname: event.target.value }));
              }}
            />
          </label>
          <label className="field">
            <span>Exchange ID {indicator("exchangeId")}</span>
            <input
              value={form.exchangeId}
              onChange={(event) => {
                markChanged("exchangeId");
                setForm((prev) => ({ ...prev, exchangeId: event.target.value }));
              }}
            />
          </label>
          <label className="field">
            <span>Wallet Address {indicator("walletAddress")}</span>
            <input
              value={form.walletAddress}
              onChange={(event) => {
                markChanged("walletAddress");
                setForm((prev) => ({ ...prev, walletAddress: event.target.value }));
              }}
            />
          </label>
          <label className="field">
            <span>Email {indicator("email")}</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => {
                markChanged("email");
                setForm((prev) => ({ ...prev, email: event.target.value }));
              }}
            />
          </label>
          <label className="field">
            <span>X / Twitter Handle {indicator("xHandle")}</span>
            <input
              value={form.xHandle}
              onChange={(event) => {
                markChanged("xHandle");
                setForm((prev) => ({ ...prev, xHandle: event.target.value }));
              }}
              placeholder="@username"
            />
          </label>
          <label className="field">
            <span>Phone {indicator("phone")}</span>
            <input
              value={form.phone}
              onChange={(event) => {
                markChanged("phone");
                setForm((prev) => ({ ...prev, phone: event.target.value }));
              }}
              placeholder="+1 000 000 0000"
            />
          </label>
          <label className="field">
            <span>Telegram {indicator("telegramHandle")}</span>
            <input
              value={form.telegramHandle}
              onChange={(event) => {
                markChanged("telegramHandle");
                setForm((prev) => ({ ...prev, telegramHandle: event.target.value }));
              }}
            />
          </label>
          <label className="field">
            <span>Country {indicator("country")}</span>
            <select
              value={form.country}
              onChange={(event) => {
                markChanged("country");
                setForm((prev) => ({ ...prev, country: event.target.value }));
              }}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Registration Status {indicator("registrationStatus")}</span>
            <select
              value={form.registrationStatus}
              onChange={(event) => {
                markChanged("registrationStatus");
                setForm((prev) => ({
                  ...prev,
                  registrationStatus: event.target.value as Participant["registrationStatus"]
                }));
              }}
            >
              {REGISTRATION_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Verification Status {indicator("verificationStatus")}</span>
            <select
              value={form.verificationStatus}
              onChange={(event) => {
                markChanged("verificationStatus");
                setForm((prev) => ({
                  ...prev,
                  verificationStatus: event.target.value as Participant["verificationStatus"]
                }));
              }}
            >
              {VERIFICATION_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Duplicate Risk Score {indicator("duplicateRiskScore")}</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={form.duplicateRiskScore}
              onChange={(event) => {
                markChanged("duplicateRiskScore");
                setForm((prev) => ({ ...prev, duplicateRiskScore: Number(event.target.value) }));
              }}
            />
          </label>
        </div>
        <div className="wrap">
          <button className="btn" type="submit" disabled={loading}>Save participant</button>
          <button className="btn-secondary" type="button" onClick={onDelete} disabled={loading || !canDelete}>Delete</button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => router.push(`/admin/competitions/${competitionId}/participants`)}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </form>
      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </section>
  );
}
