"use client";
import { useState } from "react";
import { backupJSON, eraseAll, markBackedUp, restoreBackup, setSettings, toCSV, type Ride, type Settings } from "@/lib/rides";
import { monthDay, plural, todayKey } from "@/lib/dates";
import type { Nav } from "./App";
import { Back } from "./RideSheet";
import { TabHead } from "./Prints";
import { Icon } from "./icons";

function Toggle({ on, onChange, label: l }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={l} className={`toggle${on ? " on" : ""}`} onClick={() => onChange(!on)} />;
}

export default function Account({ rides, settings, nav, toast, due }: { rides: Ride[]; settings: Settings; nav: Nav; toast: (m: string) => void; due?: boolean }) {
  const [erase, setErase] = useState(false);
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
          <button type="button" className="frow" onClick={saveBackup}><Row icon="save" title="Save a backup" sub={due
            ? `Time for a backup. ${plural(rides.length, "ride")} live only on this phone${settings.backedUp ? `, last saved ${monthDay(settings.backedUp)}` : ""}.`
            : settings.backedUp ? `Last saved ${monthDay(settings.backedUp)}. Your rides live only on this phone.` : "Your rides live only on this phone. Save a copy to Files now and then."}>
            <span className="act">Save</span>
          </Row></button>
          <label className="frow file"><Row icon="restore" title="Restore a backup" sub="Bring rides back from a saved file"><span className="act">Restore</span></Row>
            <input type="file" accept="application/json,.json" onChange={e => { restore(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </section>
        <section>
          <h2 className="acct-h">Recaps</h2>
          <div className="frow head"><Row icon="bell" title="Look back at your rides" sub="Each recap waits for you on Today" /></div>
          {([["weekly", "Weekly", "Sundays at 7 pm"], ["monthly", "Monthly", "The 1st at 9 am"], ["yearly", "Yearly", "Your year, drawn, on January 1"]] as const).map(([k, t, when]) => (
            <div key={k} className="frow sub"><span className="txt"><b>{t}</b><span>{when}</span></span><Toggle on={r[k]} onChange={v => setR(k, v)} label={`${t} recap`} /></div>
          ))}
        </section>
        <section>
          <h2 className="acct-h">Your data</h2>
          <button type="button" className="frow" onClick={exportRides}><Row icon="table" title="Export your rides" sub="Every ride as a spreadsheet"><span className="act">Export</span></Row></button>
          <a className="frow" href="/privacy"><Row icon="lock" title="Privacy" sub="What Linework keeps, in plain words">{chevron}</Row></a>
          <button type="button" className="frow" onClick={() => setErase(true)}><Row icon="trash" title="Erase this phone" sub="Removes every ride and print" danger>{chevron}</Row></button>
        </section>
      </div>
    </div>
  );
}
