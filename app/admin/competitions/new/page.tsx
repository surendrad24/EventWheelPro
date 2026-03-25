import { AdminShell } from "@/components/admin-shell";
import { requireAdminPageRole } from "@/lib/server/admin-auth";

export default async function NewCompetitionPage() {
  await requireAdminPageRole(["super_admin"]);

  return (
    <AdminShell
      title="Create Competition"
      description="The page structure follows the PRD’s operator builder: basic info, theme, registration fields, verification, prizes, schedule, and publish review."
    >
      <section className="card card-pad stack">
        <div className="form-grid">
          <label className="field">
            <span>Title</span>
            <input placeholder="Solstice Surge Championship" />
          </label>
          <label className="field">
            <span>Slug</span>
            <input placeholder="solstice-surge" />
          </label>
          <label className="field">
            <span>Theme key</span>
            <input placeholder="aurora" />
          </label>
          <label className="field">
            <span>Verification mode</span>
            <select defaultValue="hybrid rules">
              <option>open entry</option>
              <option>manual review</option>
              <option>token-gated verification</option>
              <option>allowlist/CSV import</option>
              <option>hybrid rules</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Announcement</span>
          <textarea placeholder="Share event message and eligibility reminder" />
        </label>
        <div className="wrap">
          <button className="btn">Save draft</button>
          <button className="btn-secondary">Preview event</button>
        </div>
      </section>
    </AdminShell>
  );
}
