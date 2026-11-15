import Link from "next/link";

// Figma 115:1533 Privacy and 178:4360 Terms: Top bar, copy, rows.
export default function TextPage({ title, sub, items, after, back = "/" }: { title: string; sub: string; items: [string, string, string?][]; after?: string; back?: string }) {
  return (
    <div className="app">
      <main className="view">
        <div className="sheet">
          <div className="topbar">
            <Link className="back" href={back} aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
          </div>
          <div className="page-copy"><h1 className="t-large">{title}</h1><p>{sub}</p></div>
          <div className="sheet-rows" style={{ paddingBottom: 32 }}>
            <i className="hr" />
            {items.map(([h, p, href]) => {
              const body = <span className="txt"><b>{h}</b><span>{p}</span></span>;
              return href ? <Link key={h} className="frow" href={href}>{body}</Link> : <div key={h} className="frow">{body}</div>;
            })}
            {after && <p className="page-note" style={{ paddingTop: 0, lineHeight: "17px" }}>{after}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
