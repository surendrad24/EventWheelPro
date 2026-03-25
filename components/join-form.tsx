import { RegistrationField } from "@/lib/types";

export function JoinForm({ fields }: { fields: RegistrationField[] }) {
  return (
    <form className="stack">
      <div className="form-grid">
        {fields.map((field) => (
          <label className="field" key={field.key}>
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {field.type === "textarea" ? (
              <textarea placeholder={field.placeholder} />
            ) : field.type === "country" ? (
              <select defaultValue="">
                <option value="" disabled>
                  {field.placeholder}
                </option>
                <option>India</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Brazil</option>
                <option>Germany</option>
              </select>
            ) : (
              <input
                type={field.type === "email" ? "email" : "text"}
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
      </div>
      <label className="row" style={{ alignItems: "flex-start" }}>
        <input type="checkbox" style={{ marginTop: 5 }} />
        <span className="muted">
          I confirm I meet the eligibility rules, agree to moderation checks, and accept payout verification requirements.
        </span>
      </label>
      <div className="row">
        <button type="submit" className="btn">
          Join Competition
        </button>
        <span className="muted">Demo-only form. Wire this to `POST /api/public/competitions/:slug/register`.</span>
      </div>
    </form>
  );
}
