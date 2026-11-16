"use client";
import { useState } from "react";
import { label } from "@/lib/lines";
import { backupJSON, eraseAll, linesOf, markBackedUp, restoreBackup, setSettings, toCSV, type Ride, type Settings } from "@/lib/rides";
import { monthDay, plural, todayKey } from "@/lib/dates";
import type { Nav } from "./App";
import { Back } from "./RideSheet";
import { TabHead } from "./Prints";
import { Icon } from "./icons";
import { LineMark } from "./art";

export default function Account({ rides, settings, nav, toast, due }: { rides: Ride[]; settings: Settings; nav: Nav; toast: (m: string) => void; due?: boolean }) {
  const [erase, setErase] = useState(false);
  const lines = settings.lines.length ? settings.lines : linesOf(rides).slice(0, 3);
  const r = settings.recaps;
  const setR = (k: keyof Settings["recaps"], v: boolean) => setSettings({ recaps: { ...r, [k]: v } });

  // Share sheet on a phone (Save to Files), a download elsewhere. False if closed.
  const send = async (file: File) => {
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return true; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return true;
    } catch { return false; }
  };
  const exportRides = () => send(new File([toCSV(rides)], "linework-rides.csv", { type: "text/csv" }));
  const saveBackup = async () => {
    const day = todayKey();
    if (await send(new File([backupJSON({ rides, settings })], `linework-backup-${day}.json`, { type: "application/json" }))) {
      markBackedUp(day);
      toast("Backup saved");
    }
  };
  const restore = async (f?: File) => {
    if (!f) return;
    try {
      const n = restoreBackup(await f.text());
      toast(n ? `Brought back ${plural(n, "ride")}` : "Everything in that backup is already here");
    } catch { toast("That file isn’t a Linework backup."); }
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
          <button type="button" className="btn danger" onClick={() => { eraseAll(); setErase(false); nav.tab("today"); toast("Erased"); }}>Erase this phone</button>
          <button type="button" className="btn-line" onClick={() => setErase(false)}>Cancel</button>
        </footer>
      </div>
    );
  }

  type IconName = Parameters<typeof Icon>[0]["name"];
  const Row = ({ icon, title, sub, children, danger }: { icon: IconName; title: React.ReactNode; sub: React.ReactNode; children?: React.ReactNode; danger?: boolean }) => (
    <>
      <span className={`ic${danger ? " danger" : ""}`}><Icon name={icon} size={22} /></span>
      <span className="txt"><b className={danger ? "danger" : undefined}>{title}</b><span>{sub}</span></span>
      {children}
    </>
  );
  const chevron = <span className="go"><Icon name="right" size={18} /></span>;

  // Figma 115:1414 Account · Signed out
  return (
    <div className="tab">
      <TabHead title="Account" />
      <div className="sheet-rows account">
        <section>
          <h2 className="acct-h">Backup</h2>
          <div className="frow"><Row icon="save" title="Save a backup" sub={due
            ? `Time for a backup. ${plural(rides.length, "ride")} live only on this phone${settings.backedUp ? `, last saved ${monthDay(settings.backedUp)}` : ""}.`
            : settings.backedUp ? `Last saved ${monthDay(settings.backedUp)}. Your rides live only on this phone.` : "Your rides live only on this phone. Save a copy to Files now and then."}>
            <button type="button" className={`chip${due ? " due" : ""}`} onClick={saveBackup}>Save</button>
          </Row></div>
          <div className="frow"><Row icon="restore" title="Restore a backup" sub="Bring rides back from a saved file">
            <label className="chip file">Restore<input type="file" accept="application/json,.json" onChange={e => { restore(e.target.files?.[0]); e.target.value = ""; }} /></label>
          </Row></div>
        </section>
        <section>
          <h2 className="acct-h">On this phone</h2>
          <div className="frow"><Row icon="grid" title="Today’s lines" sub={lines.length ? `${lines.map(label).join(", ").replace(/, ([^,]*)$/, " and $1")}, shown first in the grid` : "None yet. Your most-ridden lines show up first."}>
            {lines.length > 0 && <span className="marks">{lines.map(l => <LineMark key={l} line={l} lit size={26} />)}</span>}
          </Row></div>
          <div className="frow recaps"><Row icon="bell" title="Recaps" sub="Weekly on Sundays at 7 pm, monthly on the 1st, yearly on January 1" /></div>
          <div className="recap-chips" role="group" aria-label="Recaps">
            {([["weekly", "Weekly"], ["monthly", "Monthly"], ["yearly", "Yearly"]] as const).map(([k, t]) =>
              <button key={k} type="button" className="chip" aria-pressed={r[k]} onClick={() => setR(k, !r[k])}>{t}</button>)}
          </div>
        </section>
        <section>
          <h2 className="acct-h">Your data</h2>
          <div className="frow"><Row icon="table" title="Export your rides" sub="Every ride as a spreadsheet"><button type="button" className="chip" onClick={exportRides}>Export</button></Row></div>
          <a className="frow" href="/privacy"><Row icon="lock" title="Privacy" sub="What Linework keeps, in plain words">{chevron}</Row></a>
          <button type="button" className="frow" onClick={() => setErase(true)}><Row icon="trash" title="Erase this phone" sub="Removes every ride and print" danger>{chevron}</Row></button>
        </section>
      </div>
    </div>
  );
}
