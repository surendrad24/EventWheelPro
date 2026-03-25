export default function AdminLoginPage() {
  return (
    <main className="page shell" style={{ maxWidth: 520 }}>
      <section className="card card-pad stack">
        <div className="eyebrow">Admin Auth</div>
        <h1 className="title-lg">Operator sign in</h1>
        <p className="muted">The PRD calls for JWT or session auth and optional 2FA. This MVP keeps the surface ready for that next step.</p>
        <form className="stack">
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="operator@brand.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="submit" className="btn">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
