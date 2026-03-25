import Link from "next/link";

export function SiteChrome() {
  return (
    <header className="shell page" style={{ paddingBottom: 18 }}>
      <div className="row-between card card-pad">
        <div>
          <div className="eyebrow">Event Wheel Pro</div>
          <strong>Live competition platform</strong>
        </div>
        <nav className="wrap">
          <Link href="/">Home</Link>
          <Link href="/competitions/solstice-surge">Live Event</Link>
          <Link href="/admin/dashboard">Admin</Link>
          <Link href="/rules">Rules</Link>
        </nav>
      </div>
    </header>
  );
}
