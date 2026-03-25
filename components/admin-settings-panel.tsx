"use client";

import { FormEvent, useState } from "react";
import type { PlatformSettings } from "@/lib/server/admin-config-db";

export function AdminSettingsPanel({ initialSettings }: { initialSettings: PlatformSettings }) {
  const [form, setForm] = useState<PlatformSettings>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          defaultMinTokenBalance: Number(form.defaultMinTokenBalance)
        })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "settings_update_failed");
      }
      setForm(body.settings ?? form);
      setMessage("Settings updated.");
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : "settings_update_failed";
      setError(`Unable to update settings: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <h2 className="section-title">Global Settings</h2>
        <form className="stack" onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Brand Name</span>
              <input
                value={form.brandName}
                onChange={(event) => setForm((prev) => ({ ...prev, brandName: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Support Email</span>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(event) => setForm((prev) => ({ ...prev, supportEmail: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Default Chain</span>
              <input
                value={form.defaultChainKey}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultChainKey: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Default Min Token Balance</span>
              <input
                type="number"
                value={form.defaultMinTokenBalance}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultMinTokenBalance: Number(event.target.value || 0) }))}
              />
            </label>
            <label className="field">
              <span>Default Verification Mode</span>
              <input
                value={form.defaultVerificationMode}
                onChange={(event) => setForm((prev) => ({ ...prev, defaultVerificationMode: event.target.value }))}
              />
            </label>
            <label className="field">
              <span>Maintenance Mode</span>
              <select
                value={form.maintenanceMode ? "on" : "off"}
                onChange={(event) => setForm((prev) => ({ ...prev, maintenanceMode: event.target.value === "on" }))}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Webhook URL</span>
            <input
              value={form.webhookUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, webhookUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          <label className="field">
            <span>Webhook Secret</span>
            <input
              value={form.webhookSecret}
              onChange={(event) => setForm((prev) => ({ ...prev, webhookSecret: event.target.value }))}
            />
          </label>
          <div className="wrap">
            <button className="btn" type="submit" disabled={loading}>Save Settings</button>
          </div>
        </form>
      </section>
      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
