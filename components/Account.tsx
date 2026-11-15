"use client";
import { useState } from "react";
import { label } from "@/lib/lines";
import { eraseAll, linesOf, setSettings, toCSV, type Ride, type Settings } from "@/lib/rides";
import { plural } from "@/lib/dates";
import type { Nav } from "./App";
import { Back } from "./RideSheet";

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

  // Figma 192:4215 Erase this phone
  if (erase) {
    return (
      <div className="sheet">
        <Back onClick={() => setErase(false)} />
        <div className="page-copy">
          <h1 className="t-large">Erase this phone?</h1>
          <p>Removes your rides and prints from this iPhone. {plural(rides.length, "ride")} will be gone.</p>
        </div>
        <footer className="sheet-foot" style={{ paddingBottom: 34 }}>
          <button type="button" className="btn" onClick={() => { eraseAll(); setErase(false); nav.pop(); toast("Erased"); }}>Erase this phone</button>
          <button type="button" className="btn-line" onClick={() => setErase(false)}>Cancel</button>
        </footer>
      </div>
    );
  }

  const Row = ({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) => (
    <div className="frow"><span className="txt"><b>{title}</b><span>{sub}</span></span>{children}</div>
  );

  // Figma 115:1414 Account · Signed out
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="sheet-copy"><h1 className="t-page" style={{ color: "var(--ui-text)" }}>Account</h1></div>
      <div className="sheet-rows account">
        <p className="kicker">Backup</p><i className="hr" />
        <Row title="Keep your prints safe" sub="Only on this phone right now. Make a free account to back it up.">
          <button type="button" className="val" onClick={() => toast("Accounts are coming soon.")}>Set up</button>
        </Row>
        <p className="kicker">Today’s lines</p><i className="hr" />
        <Row title={lines.length ? lines.map(label).join(", ").replace(/, ([^,]*)$/, " and $1") : "None yet"} sub="Shown first in the grid" />
        <p className="kicker">Recaps</p><i className="hr" />
        <Row title="Weekly" sub="Sundays at 7 pm"><Toggle on={r.weekly} onChange={v => setR("weekly", v)} label="Weekly recap" /></Row>
        <Row title="Monthly" sub="The 1st at 9 am"><Toggle on={r.monthly} onChange={v => setR("monthly", v)} label="Monthly recap" /></Row>
        <Row title="Yearly" sub="2026, Drawn. on January 1"><Toggle on={r.yearly} onChange={v => setR("yearly", v)} label="Yearly recap" /></Row>
        <p className="kicker">Your data</p><i className="hr" />
        <Row title="Export your rides" sub="Every ride as a spreadsheet"><button type="button" className="val" onClick={exportRides}>Export</button></Row>
        <a className="frow" href="/privacy"><span className="txt"><b>Privacy</b><span>What Linework keeps, in plain words</span></span></a>
        <button type="button" className="frow" onClick={() => setErase(true)}><span className="txt"><b>Erase this phone</b><span>Removes every ride and print</span></span></button>
      </div>
    </div>
  );
}
