import Link from "next/link";

export const metadata = { title: "Privacy · Linework" };

const ITEMS: [string, string][] = [
  ["What we keep", "Your rides: the line, the day, and any time or stations you add. Your email, if you make an account."],
  ["What we don’t", "Your location, contacts or OMNY card. No ads, and no tracking across apps."],
  ["Where it lives", "On this phone. With an account, also backed up, so a new phone gets it."],
  ["Deleting it", "Account, then Delete account, erases everything from our servers and this phone."],
  ["MTA data", "Routes, stations and scheduled times come from the MTA’s public GTFS feed. Linework isn’t made by or affiliated with the MTA."],
];

export default function Privacy() {
  return (
    <div className="app">
      <main className="view">
        <div className="screen page">
          <Link className="back" href="/" aria-label="Back">‹</Link>
          <h1 className="t-title">Privacy</h1>
          <p className="t-caption muted">The short version.</p>
          <div className="rule" />
          {ITEMS.map(([h, p]) => (
            <div key={h} className="row"><span className="txt"><b className="t-headline">{h}</b><span className="t-caption muted">{p}</span></span></div>
          ))}
        </div>
      </main>
    </div>
  );
}
