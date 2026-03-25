export default async function ClaimPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="page shell">
      <section className="card card-pad stack">
        <div className="eyebrow">Claim Prize</div>
        <h1 className="title-lg">Winner claim confirmation</h1>
        <p className="muted">
          This PRD-aligned placeholder page is where the secure claim token flow lives. Replace the demo token lookup
          with a database-backed claim record and signed verification.
        </p>
        <div className="chip">Claim token: {token}</div>
        <form className="stack">
          <label className="field">
            <span>Wallet address</span>
            <input placeholder="0x..." />
          </label>
          <label className="field">
            <span>Identity confirmation notes</span>
            <textarea placeholder="Anything the moderation team should review" />
          </label>
          <button type="submit" className="btn">
            Submit claim
          </button>
        </form>
      </section>
    </main>
  );
}
