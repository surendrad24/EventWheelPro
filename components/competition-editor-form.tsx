"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Competition, CompetitionGameType, CompetitionStatus, PrizeTier, RegistrationField } from "@/lib/types";

type EditorMode = "create" | "edit";

type CompetitionEditorState = {
  title: string;
  slug: string;
  status: CompetitionStatus;
  gameType: CompetitionGameType;
  description: string;
  announcementText: string;
  themeKey: string;
  chainKey: string;
  tokenContractAddress: string;
  minTokenBalance: number;
  verificationMode: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  eventStartAt: string;
  eventEndAt: string;
  totalWinnerSlots: number;
  autoRemoveWinners: boolean;
  leaderboardPublic: boolean;
  allowPublicWinners: boolean;
  registrationFields: RegistrationField[];
  prizeTiers: PrizeTier[];
};

const STATUS_OPTIONS: CompetitionStatus[] = ["draft", "scheduled", "live", "paused", "completed", "archived"];
const GAME_TYPE_OPTIONS: CompetitionGameType[] = ["wheel_of_fortune", "flip_to_win", "quiz"];
const FIELD_TYPES: RegistrationField["type"][] = ["text", "email", "wallet", "country", "textarea"];

function toInputDateTime(iso?: string) {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function toEditorState(competition?: Competition): CompetitionEditorState {
  if (!competition) {
    const now = new Date();
    const plusHours = new Date(now.getTime() + 1000 * 60 * 60 * 2);
    const plusDays = new Date(now.getTime() + 1000 * 60 * 60 * 24);

    return {
      title: "",
      slug: "",
      status: "draft",
      gameType: "wheel_of_fortune",
      description: "",
      announcementText: "",
      themeKey: "matrix-neon",
      chainKey: "BSC",
      tokenContractAddress: "",
      minTokenBalance: 0,
      verificationMode: "manual review",
      registrationOpenAt: toInputDateTime(now.toISOString()),
      registrationCloseAt: toInputDateTime(plusHours.toISOString()),
      eventStartAt: toInputDateTime(plusHours.toISOString()),
      eventEndAt: toInputDateTime(plusDays.toISOString()),
      totalWinnerSlots: 1,
      autoRemoveWinners: true,
      leaderboardPublic: true,
      allowPublicWinners: true,
      registrationFields: [
        {
          key: "display_name",
          label: "Display Name",
          type: "text",
          required: true,
          placeholder: "Your display name"
        },
        {
          key: "wallet",
          label: "Wallet Address",
          type: "wallet",
          required: true,
          placeholder: "0x..."
        }
      ],
      prizeTiers: [
        {
          id: "tier-1",
          label: "Winner",
          description: "Primary reward tier",
          quantity: 1,
          valueText: "$100"
        }
      ]
    };
  }

  return {
    title: competition.title,
    slug: competition.slug,
    status: competition.status,
    gameType: competition.gameType,
    description: competition.description,
    announcementText: competition.announcementText,
    themeKey: competition.themeKey,
    chainKey: competition.chainKey,
    tokenContractAddress: competition.tokenContractAddress,
    minTokenBalance: competition.minTokenBalance,
    verificationMode: competition.verificationMode,
    registrationOpenAt: toInputDateTime(competition.registrationOpenAt),
    registrationCloseAt: toInputDateTime(competition.registrationCloseAt),
    eventStartAt: toInputDateTime(competition.eventStartAt),
    eventEndAt: toInputDateTime(competition.eventEndAt),
    totalWinnerSlots: competition.totalWinnerSlots,
    autoRemoveWinners: competition.autoRemoveWinners,
    leaderboardPublic: competition.leaderboardPublic,
    allowPublicWinners: competition.allowPublicWinners,
    registrationFields: competition.registrationFields,
    prizeTiers: competition.prizeTiers
  };
}

export function CompetitionEditorForm({
  mode,
  competition
}: {
  mode: EditorMode;
  competition?: Competition;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CompetitionEditorState>(() => toEditorState(competition));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => (mode === "create" ? "Create competition" : "Save changes"), [mode]);

  function slugify(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        ...form,
        minTokenBalance: Number(form.minTokenBalance) || 0,
        totalWinnerSlots: Math.max(1, Number(form.totalWinnerSlots) || 1),
        registrationOpenAt: toIso(form.registrationOpenAt),
        registrationCloseAt: toIso(form.registrationCloseAt),
        eventStartAt: toIso(form.eventStartAt),
        eventEndAt: toIso(form.eventEndAt),
        registrationFields: form.registrationFields.map((field, index) => ({
          ...field,
          key: field.key.trim() || `field_${index + 1}`,
          label: field.label.trim() || `Field ${index + 1}`,
          placeholder: field.placeholder.trim()
        })),
        prizeTiers: form.prizeTiers.map((tier, index) => ({
          ...tier,
          id: tier.id.trim() || `tier-${index + 1}`,
          label: tier.label.trim() || `Tier ${index + 1}`,
          description: tier.description.trim(),
          valueText: tier.valueText.trim(),
          quantity: Math.max(1, Number(tier.quantity) || 1)
        }))
      };

      const endpoint = mode === "create" ? "/api/admin/competitions" : `/api/admin/competitions/${competition?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "save_failed");
      }

      const nextCompetition = body.competition as Competition;
      setMessage(mode === "create" ? "Competition created." : "Competition updated.");

      if (mode === "create" && nextCompetition?.id) {
        router.push(`/admin/competitions/${nextCompetition.id}`);
      }
      router.refresh();
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "save_failed";
      setError(`Save failed: ${text}`);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCompetition() {
    if (!competition?.id) {
      return;
    }
    const confirmed = window.confirm(`Delete ${competition.title}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/competitions/${competition.id}`, {
        method: "DELETE"
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "delete_failed");
      }

      router.push("/admin/competitions");
      router.refresh();
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : "delete_failed";
      setError(`Delete failed: ${text}`);
      setSaving(false);
    }
  }

  function updateRegistrationField(index: number, patch: Partial<RegistrationField>) {
    setForm((prev) => ({
      ...prev,
      registrationFields: prev.registrationFields.map((field, fieldIndex) => (
        fieldIndex === index ? { ...field, ...patch } : field
      ))
    }));
  }

  function updatePrizeTier(index: number, patch: Partial<PrizeTier>) {
    setForm((prev) => ({
      ...prev,
      prizeTiers: prev.prizeTiers.map((tier, tierIndex) => (
        tierIndex === index ? { ...tier, ...patch } : tier
      ))
    }));
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <section className="card card-pad stack">
        <h2 className="section-title">Basic Info</h2>
        <div className="form-grid">
          <label className="field">
            <span>Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => {
                const nextTitle = event.target.value;
                setForm((prev) => ({
                  ...prev,
                  title: nextTitle,
                  slug: slugify(nextTitle)
                }));
              }}
              placeholder="TinkTank Party Wheel"
            />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              required
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="tinktank-party-wheel"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              className="matrix-neon-select"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as CompetitionStatus }))}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Game Type</span>
            <select
              className="matrix-neon-select"
              value={form.gameType}
              onChange={(event) => setForm((prev) => ({ ...prev, gameType: event.target.value as CompetitionGameType }))}
            >
              {GAME_TYPE_OPTIONS.map((gameType) => (
                <option key={gameType} value={gameType}>{gameType.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Chain</span>
            <input
              value={form.chainKey}
              onChange={(event) => setForm((prev) => ({ ...prev, chainKey: event.target.value }))}
              placeholder="BSC"
            />
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        </label>
        <label className="field">
          <span>Announcement</span>
          <textarea value={form.announcementText} onChange={(event) => setForm((prev) => ({ ...prev, announcementText: event.target.value }))} />
        </label>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Theme</h2>
        <div className="form-grid">
          <label className="field">
            <span>Theme Key</span>
            <input value={form.themeKey} onChange={(event) => setForm((prev) => ({ ...prev, themeKey: event.target.value }))} />
          </label>
          <label className="field">
            <span>Token Contract Address</span>
            <input value={form.tokenContractAddress} onChange={(event) => setForm((prev) => ({ ...prev, tokenContractAddress: event.target.value }))} />
          </label>
          <label className="field">
            <span>Minimum Token Balance</span>
            <input
              type="number"
              min={0}
              step="0.0001"
              value={form.minTokenBalance}
              onChange={(event) => setForm((prev) => ({ ...prev, minTokenBalance: Number(event.target.value) }))}
            />
          </label>
        </div>
      </section>

      <section className="card card-pad stack">
        <div className="row-between">
          <h2 className="section-title">Registration Fields</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setForm((prev) => ({
              ...prev,
              registrationFields: [
                ...prev.registrationFields,
                {
                  key: `field_${prev.registrationFields.length + 1}`,
                  label: "New Field",
                  type: "text",
                  required: false,
                  placeholder: ""
                }
              ]
            }))}
          >
            Add field
          </button>
        </div>
        <div className="stack">
          {form.registrationFields.map((field, index) => (
            <article key={`${field.key}-${index}`} className="list-item stack">
              <div className="form-grid">
                <label className="field">
                  <span>Key</span>
                  <input value={field.key} onChange={(event) => updateRegistrationField(index, { key: event.target.value })} />
                </label>
                <label className="field">
                  <span>Label</span>
                  <input value={field.label} onChange={(event) => updateRegistrationField(index, { label: event.target.value })} />
                </label>
                <label className="field">
                  <span>Type</span>
                  <select value={field.type} onChange={(event) => updateRegistrationField(index, { type: event.target.value as RegistrationField["type"] })}>
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Required</span>
                  <select value={field.required ? "yes" : "no"} onChange={(event) => updateRegistrationField(index, { required: event.target.value === "yes" })}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Placeholder</span>
                <input value={field.placeholder} onChange={(event) => updateRegistrationField(index, { placeholder: event.target.value })} />
              </label>
              <div className="wrap">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setForm((prev) => ({
                    ...prev,
                    registrationFields: prev.registrationFields.filter((_, fieldIndex) => fieldIndex !== index)
                  }))}
                  disabled={form.registrationFields.length <= 1}
                >
                  Remove field
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Verification</h2>
        <label className="field">
          <span>Verification Mode</span>
          <select value={form.verificationMode} onChange={(event) => setForm((prev) => ({ ...prev, verificationMode: event.target.value }))}>
            <option value="open entry">open entry</option>
            <option value="manual review">manual review</option>
            <option value="token-gated verification">token-gated verification</option>
            <option value="allowlist/CSV import">allowlist/CSV import</option>
            <option value="hybrid rules">hybrid rules</option>
          </select>
        </label>
      </section>

      <section className="card card-pad stack">
        <div className="row-between">
          <h2 className="section-title">Prizes</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setForm((prev) => ({
              ...prev,
              prizeTiers: [
                ...prev.prizeTiers,
                {
                  id: `tier-${prev.prizeTiers.length + 1}`,
                  label: `Tier ${prev.prizeTiers.length + 1}`,
                  description: "",
                  quantity: 1,
                  valueText: ""
                }
              ]
            }))}
          >
            Add tier
          </button>
        </div>
        <div className="stack">
          {form.prizeTiers.map((tier, index) => (
            <article key={`${tier.id}-${index}`} className="list-item stack">
              <div className="form-grid">
                <label className="field">
                  <span>ID</span>
                  <input value={tier.id} onChange={(event) => updatePrizeTier(index, { id: event.target.value })} />
                </label>
                <label className="field">
                  <span>Label</span>
                  <input value={tier.label} onChange={(event) => updatePrizeTier(index, { label: event.target.value })} />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={tier.quantity}
                    onChange={(event) => updatePrizeTier(index, { quantity: Number(event.target.value) })}
                  />
                </label>
                <label className="field">
                  <span>Value</span>
                  <input value={tier.valueText} onChange={(event) => updatePrizeTier(index, { valueText: event.target.value })} />
                </label>
              </div>
              <label className="field">
                <span>Description</span>
                <textarea value={tier.description} onChange={(event) => updatePrizeTier(index, { description: event.target.value })} />
              </label>
              <div className="wrap">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setForm((prev) => ({
                    ...prev,
                    prizeTiers: prev.prizeTiers.filter((_, tierIndex) => tierIndex !== index)
                  }))}
                  disabled={form.prizeTiers.length <= 1}
                >
                  Remove tier
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Schedule</h2>
        <div className="form-grid">
          <label className="field">
            <span>Registration Opens</span>
            <input type="datetime-local" value={form.registrationOpenAt} onChange={(event) => setForm((prev) => ({ ...prev, registrationOpenAt: event.target.value }))} />
          </label>
          <label className="field">
            <span>Registration Closes</span>
            <input type="datetime-local" value={form.registrationCloseAt} onChange={(event) => setForm((prev) => ({ ...prev, registrationCloseAt: event.target.value }))} />
          </label>
          <label className="field">
            <span>Event Start</span>
            <input type="datetime-local" value={form.eventStartAt} onChange={(event) => setForm((prev) => ({ ...prev, eventStartAt: event.target.value }))} />
          </label>
          <label className="field">
            <span>Event End</span>
            <input type="datetime-local" value={form.eventEndAt} onChange={(event) => setForm((prev) => ({ ...prev, eventEndAt: event.target.value }))} />
          </label>
          <label className="field">
            <span>Total Winner Slots</span>
            <input
              type="number"
              min={1}
              value={form.totalWinnerSlots}
              onChange={(event) => setForm((prev) => ({ ...prev, totalWinnerSlots: Number(event.target.value) }))}
            />
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Auto Remove Winners</span>
            <select value={form.autoRemoveWinners ? "yes" : "no"} onChange={(event) => setForm((prev) => ({ ...prev, autoRemoveWinners: event.target.value === "yes" }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="field">
            <span>Leaderboard Public</span>
            <select value={form.leaderboardPublic ? "yes" : "no"} onChange={(event) => setForm((prev) => ({ ...prev, leaderboardPublic: event.target.value === "yes" }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="field">
            <span>Allow Public Winners</span>
            <select value={form.allowPublicWinners ? "yes" : "no"} onChange={(event) => setForm((prev) => ({ ...prev, allowPublicWinners: event.target.value === "yes" }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </section>

      <section className="card card-pad stack">
        <h2 className="section-title">Publish Review</h2>
        <div className="list-item">{form.title || "Untitled competition"} • {form.status} • {form.prizeTiers.length} prize tier(s) • {form.registrationFields.length} registration field(s)</div>
        <div className="wrap">
          <button type="submit" className="btn" disabled={saving}>{saving ? "Saving..." : submitLabel}</button>
          {mode === "edit" && (
            <button type="button" className="btn-secondary" onClick={onDeleteCompetition} disabled={saving}>
              Delete competition
            </button>
          )}
        </div>
      </section>

      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </form>
  );
}
