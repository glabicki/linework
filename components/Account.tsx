"use client";
import { useState } from "react";
import { label } from "@/lib/lines";
import { eraseAll, linesOf, setSettings, toCSV, type Ride, type Settings } from "@/lib/rides";
import { plural } from "@/lib/dates";
import type { Nav } from "./App";

function Toggle({ on, onChange, label: l }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={l} className={`toggle${on ? " on" : ""}`} onClick={() => onChange(!on)} />;
}

export default function Account({ rides, settings, nav, toast }: { rides: Ride[]; settings: Settings; nav: Nav; toast: (m: string) => void }) {
  const [erase, setErase] = useState(false);
  const lines = settings.lines.length ? settings.lines : linesOf(rides).slice(0, 3);
  const r = settings.recaps;
  const setR = (k: keyof Settings["recaps"], v: boolean) => setSettings({ recaps: { ...r, [k]: v } });

  const exportRides = async () => {
    const file = new File([toCSV(rides)], "linework-rides.csv", { type: "text/csv" });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { /* closed the share sheet */ }
  };

  if (erase) {
    return (
      <div className="screen page">
        <button type="button" className="back" onClick={() => setErase(false)} aria-label="Back">‹</button>
        <h1 className="t-title">Erase this phone?</h1>
        <p className="t-caption muted">Removes your rides and prints from this iPhone. {plural(rides.length, "ride")} will be gone.</p>
        <footer className="foot">
          <button type="button" className="btn" onClick={() => { eraseAll(); setErase(false); nav.pop(); toast("Erased"); }}>Erase this phone</button>
          <button type="button" className="link" onClick={() => setErase(false)}>Cancel</button>
        </footer>
      </div>
    );
  }

  return (
    <div className="screen page">
      <button type="button" className="back" onClick={nav.pop} aria-label="Back">‹</button>
      <h1 className="t-page">Account</h1>

      <p className="t-label muted section">Backup</p>
      <div className="row">
        <span className="txt"><b className="t-headline">Keep your prints safe</b><span className="t-caption muted">Only on this phone right now. Make a free account to back it up.</span></span>
        <button type="button" className="row-act" onClick={() => toast("Accounts are coming soon.")}>Set up</button>
      </div>

      <p className="t-label muted section">Today’s lines</p>
      <div className="row"><span className="txt"><b className="t-headline">{lines.length ? lines.map(label).join(", ").replace(/, ([^,]*)$/, " and $1") : "None yet"}</b><span className="t-caption muted">Shown first in the grid</span></span></div>

      <p className="t-label muted section">Recaps</p>
      <div className="row"><span className="txt"><b className="t-headline">Weekly</b><span className="t-caption muted">Sundays at 7 pm</span></span><Toggle on={r.weekly} onChange={v => setR("weekly", v)} label="Weekly recap" /></div>
      <div className="row"><span className="txt"><b className="t-headline">Monthly</b><span className="t-caption muted">The 1st at 9 am</span></span><Toggle on={r.monthly} onChange={v => setR("monthly", v)} label="Monthly recap" /></div>
      <div className="row"><span className="txt"><b className="t-headline">Yearly</b><span className="t-caption muted">2026, Drawn. on January 1</span></span><Toggle on={r.yearly} onChange={v => setR("yearly", v)} label="Yearly recap" /></div>

      <p className="t-label muted section">Your data</p>
      <div className="row"><span className="txt"><b className="t-headline">Export your rides</b><span className="t-caption muted">Every ride as a spreadsheet</span></span><button type="button" className="row-act" onClick={exportRides}>Export</button></div>
      <a className="row" href="/privacy"><span className="txt"><b className="t-headline">Privacy</b><span className="t-caption muted">What Linework keeps, in plain words</span></span></a>
      <button type="button" className="row" onClick={() => setErase(true)}><span className="txt"><b className="t-headline">Erase this phone</b><span className="t-caption muted">Removes every ride and print</span></span></button>
    </div>
  );
}
