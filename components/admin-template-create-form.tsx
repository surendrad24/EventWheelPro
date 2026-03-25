"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TemplateForm = {
  name: string;
  slug: string;
  mode: "wheel" | "flip" | "quiz";
  description: string;
  defaultThemeKey: string;
  defaultAnnouncementText: string;
};

function emptyTemplateForm(): TemplateForm {
  return {
    name: "",
    slug: "",
    mode: "wheel",
    description: "",
    defaultThemeKey: "wheel",
    defaultAnnouncementText: ""
  };
}

export function AdminTemplateCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<TemplateForm>(emptyTemplateForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "template_create_failed");
      }
      router.push("/admin/templates");
      router.refresh();
    } catch (createError) {
      const text = createError instanceof Error ? createError.message : "template_create_failed";
      setError(`Create failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card card-pad stack">
      <h2 className="section-title">Create Template</h2>
      <form className="stack" onSubmit={onCreate}>
        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label className="field">
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            />
          </label>
          <label className="field">
              <span>Mode</span>
              <select
                value={form.mode}
                onChange={(event) => setForm((prev) => ({ ...prev, mode: event.target.value as "wheel" | "flip" | "quiz" }))}
              >
                <option value="wheel">wheel</option>
                <option value="flip">flip</option>
                <option value="quiz">quiz</option>
              </select>
            </label>
          <label className="field">
            <span>Default Theme Key</span>
            <input
              value={form.defaultThemeKey}
              onChange={(event) => setForm((prev) => ({ ...prev, defaultThemeKey: event.target.value }))}
            />
          </label>
        </div>
        <label className="field">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>Default Announcement</span>
          <textarea
            value={form.defaultAnnouncementText}
            onChange={(event) => setForm((prev) => ({ ...prev, defaultAnnouncementText: event.target.value }))}
          />
        </label>
        <div className="wrap">
          <button className="btn" type="submit" disabled={loading}>Create Template</button>
          <button className="btn-ghost" type="button" disabled={loading} onClick={() => router.push("/admin/templates")}>
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}
    </section>
  );
}
