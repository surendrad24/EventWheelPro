"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompetitionTemplate } from "@/lib/server/admin-config-db";

type TemplateForm = {
  name: string;
  slug: string;
  mode: "wheel" | "quiz";
  description: string;
  defaultThemeKey: string;
  defaultAnnouncementText: string;
};

export function AdminTemplatesPanel({ initialTemplates }: { initialTemplates: CompetitionTemplate[] }) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TemplateForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshTemplates() {
    const response = await fetch("/api/admin/templates", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error ?? "templates_load_failed");
    }
    setTemplates(body.templates ?? []);
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId || !editForm) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/templates/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "template_update_failed");
      }
      await refreshTemplates();
      setEditingId(null);
      setEditForm(null);
      setMessage("Template updated.");
    } catch (updateError) {
      const text = updateError instanceof Error ? updateError.message : "template_update_failed";
      setError(`Update failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(templateId: string, name: string) {
    const confirmed = window.confirm(`Delete template "${name}"?`);
    if (!confirmed) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "template_delete_failed");
      }
      await refreshTemplates();
      setMessage("Template deleted.");
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : "template_delete_failed";
      setError(`Delete failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  async function onApply(templateId: string, templateName: string) {
    const title = window.prompt("Competition title for this template", `${templateName} ${new Date().toISOString().slice(0, 10)}`);
    if (!title) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "template_apply_failed");
      }
      setMessage("Competition created from template.");
      router.push(`/admin/competitions/${body.competition.id}`);
    } catch (applyError) {
      const text = applyError instanceof Error ? applyError.message : "template_apply_failed";
      setError(`Apply failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(template: CompetitionTemplate) {
    setEditingId(template.id);
    setEditForm({
      name: template.name,
      slug: template.slug,
      mode: template.mode,
      description: template.description,
      defaultThemeKey: template.defaultThemeKey,
      defaultAnnouncementText: template.defaultAnnouncementText
    });
    setError(null);
    setMessage(null);
  }

  return (
    <div className="stack">
      <section className="card card-pad stack">
        <div className="row-between">
          <h2 className="section-title">All Templates</h2>
          <Link className="btn" href="/admin/templates/new">
            Create Template
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mode</th>
              <th>Theme</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>
                  <strong>{template.name}</strong>
                  <div className="muted">{template.slug}</div>
                </td>
                <td>{template.mode}</td>
                <td>{template.defaultThemeKey}</td>
                <td>
                  <div className="wrap" style={{ justifyContent: "flex-end" }}>
                    <button className="btn-ghost" type="button" disabled={loading} onClick={() => onApply(template.id, template.name)}>Apply</button>
                    <button className="btn-ghost" type="button" disabled={loading} onClick={() => openEdit(template)}>Edit</button>
                    <button className="btn-secondary" type="button" disabled={loading} onClick={() => onDelete(template.id, template.name)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {editingId && editForm && (
        <section className="card card-pad stack">
          <h2 className="section-title">Edit Template</h2>
          <form className="stack" onSubmit={onUpdate}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input value={editForm.name} onChange={(event) => setEditForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))} />
              </label>
              <label className="field">
                <span>Slug</span>
                <input value={editForm.slug} onChange={(event) => setEditForm((prev) => (prev ? { ...prev, slug: event.target.value } : prev))} />
              </label>
              <label className="field">
                <span>Mode</span>
                <select
                  value={editForm.mode}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, mode: event.target.value as "wheel" | "quiz" } : prev))}
                >
                  <option value="wheel">wheel</option>
                  <option value="quiz">quiz</option>
                </select>
              </label>
              <label className="field">
                <span>Default Theme Key</span>
                <input
                  value={editForm.defaultThemeKey}
                  onChange={(event) => setEditForm((prev) => (prev ? { ...prev, defaultThemeKey: event.target.value } : prev))}
                />
              </label>
            </div>
            <label className="field">
              <span>Description</span>
              <textarea
                value={editForm.description}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
              />
            </label>
            <label className="field">
              <span>Default Announcement</span>
              <textarea
                value={editForm.defaultAnnouncementText}
                onChange={(event) => setEditForm((prev) => (prev ? { ...prev, defaultAnnouncementText: event.target.value } : prev))}
              />
            </label>
            <div className="wrap">
              <button className="btn" type="submit" disabled={loading}>Save Changes</button>
              <button className="btn-ghost" type="button" disabled={loading} onClick={() => { setEditingId(null); setEditForm(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {message && <p className="muted" style={{ color: "#2dff56" }}>{message}</p>}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </div>
  );
}
