import Link from "next/link";

export const metadata = { title: "Link not working · Linework" };

// Figma 192:4537 Link not working
export default function NotFound() {
  return (
    <div className="app">
      <main className="view">
        <div className="sheet">
          <div className="topbar" />
          <div className="page-copy">
            <h1 className="t-large">This link doesn’t work.</h1>
            <p>It may have expired, or a letter got lost. Your rides are safe.</p>
          </div>
          <footer className="sheet-foot">
            <Link className="btn" href="/">Open Linework</Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
