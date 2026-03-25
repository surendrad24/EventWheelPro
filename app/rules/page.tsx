import { SiteChrome } from "@/components/site-chrome";

export default function RulesPage() {
  return (
    <>
      <SiteChrome />
      <main className="page shell">
        <section className="card card-pad stack">
          <div className="eyebrow">Competition Rules</div>
          <h1 className="title-lg">Eligibility, verification, and claims</h1>
          <p className="muted">
            This MVP mirrors the PRD’s rule model: configurable fields, duplicate detection, moderator approval, claim
            deadlines, and manual payout reconciliation.
          </p>
          <div className="list">
            <div className="list-item">Participants must complete required fields and accept platform rules.</div>
            <div className="list-item">Token-gated or manual review checks determine wheel eligibility.</div>
            <div className="list-item">Winners must submit claim details before the configured deadline.</div>
            <div className="list-item">All admin actions and spin outcomes should be logged for auditability.</div>
          </div>
        </section>
      </main>
    </>
  );
}
