import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { SiteChrome } from "@/components/site-chrome";
import { StatCard } from "@/components/stat-card";
import { StatusChip } from "@/components/status-chip";
import { WheelPreview } from "@/components/wheel-preview";
import { formatDateTime, formatPercent, timeLeftLabel } from "@/lib/format";
import { store } from "@/lib/server/in-memory-store";

export default async function CompetitionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maybeCompetition = store.getCompetitionBySlug(slug);

  if (!maybeCompetition) {
    notFound();
  }

  const competition = maybeCompetition;

  const eventParticipants = store.getParticipants(competition.id);
  const eventWinners = store.listWinners(competition.id);

  return (
    <>
      <SiteChrome />
      <main className="page shell stack">
        <section className="ticker">
          <span>{competition.announcementText} • {competition.announcementText} • {competition.announcementText}</span>
        </section>

        <section className="hero-grid">
          <article className="card card-pad stack">
            <div className="row-between">
              <div className="chip live">{competition.status}</div>
              <StatusChip label={competition.verificationMode} />
            </div>
            <div className="eyebrow">Live Competition</div>
            <h1 className="title-xl">{competition.title}</h1>
            <p className="muted">{competition.description}</p>
            <div className="stats">
              <StatCard
                label="Participants"
                value={competition.stats.totalParticipants}
                hint={`${competition.stats.totalApproved} approved`}
              />
              <StatCard label="Registration" value={timeLeftLabel(competition.registrationCloseAt)} hint="Server synced" />
              <StatCard label="Winners" value={competition.stats.totalWinners} hint={`${competition.totalWinnerSlots} total slots`} />
            </div>
            <div className="wrap">
              <a className="btn" href="#join">
                Join Competition
              </a>
              <Link className="btn-secondary" href={`/competitions/${competition.slug}/leaderboard`}>
                Leaderboard
              </Link>
              <Link className="btn-ghost" href={`/competitions/${competition.slug}/winners`}>
                Winners
              </Link>
            </div>
          </article>

          <aside className="card card-pad stack">
            <div className="eyebrow">Participant Feed</div>
            <div className="list">
              {eventParticipants.map((participant) => (
                <div key={participant.id} className="list-item row-between">
                  <div>
                    <strong>{participant.displayName}</strong>
                    <div className="muted">{participant.country}</div>
                  </div>
                  <StatusChip label={participant.registrationStatus} />
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="hero-grid">
          <article className="card card-pad stack" style={{ alignItems: "center" }}>
            <div className="eyebrow">Main Wheel</div>
            <WheelPreview entrants={eventParticipants} highlight={eventWinners[0]?.displayName} />
            <div className="wrap" style={{ justifyContent: "center" }}>
              <div className="chip">Chain: {competition.chainKey}</div>
              <div className="chip">Min Token: {competition.minTokenBalance}</div>
              <div className="chip">Auto-remove winners: {competition.autoRemoveWinners ? "On" : "Off"}</div>
            </div>
          </article>

          <aside className="stack">
            <section id="join" className="card card-pad stack">
              <div className="eyebrow">Join Competition</div>
              <h2 className="section-title">Configurable registration flow</h2>
              <JoinForm fields={competition.registrationFields} />
            </section>

            <section className="card card-pad stack">
              <h2 className="section-title">Recent winners</h2>
              {eventWinners.map((winner) => (
                <div key={winner.id} className="list-item row-between">
                  <div>
                    <strong>{winner.displayName}</strong>
                    <div className="muted">{winner.prizeLabel} • {formatDateTime(winner.wonAt)}</div>
                  </div>
                  <StatusChip label={winner.claimStatus} />
                </div>
              ))}
            </section>
          </aside>
        </section>

        <section className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <article className="card card-pad stack">
            <div className="eyebrow">How It Works</div>
            <h2 className="section-title">Register, verify, spin</h2>
            <p className="muted">The flow supports open entry, manual review, token gates, allowlists, and hybrid rules.</p>
          </article>
          <article className="card card-pad stack">
            <div className="eyebrow">Eligibility</div>
            <h2 className="section-title">Verification with auditability</h2>
            <p className="muted">
              Duplicate risk and verification history should be stored server-side, with re-check support for admins.
            </p>
          </article>
          <article className="card card-pad stack">
            <div className="eyebrow">Prize Structure</div>
            <h2 className="section-title">Transparent reward tiers</h2>
            <div className="list">
              {competition.prizeTiers.map((tier) => (
                <div className="list-item" key={tier.id}>
                  <strong>{tier.label}</strong>
                  <div className="muted">
                    {tier.valueText} • Qty {tier.quantity} • {tier.description}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card card-pad">
          <div className="eyebrow">Audit Snapshot</div>
          <div className="row-between">
            <div>
              <strong>Registration closes {formatDateTime(competition.registrationCloseAt)}</strong>
              <div className="muted">Duplicate risk threshold example: {formatPercent(0.18)}</div>
            </div>
            <Link className="btn-secondary" href={`/admin/competitions/${competition.id}/live-control`}>
              Operator live control
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
