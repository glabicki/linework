"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Today from "./Today";
import Prints from "./Prints";
import Recaps from "./Recaps";
import RideSheet from "./RideSheet";
import DayPage from "./DayPage";
import MakePrint from "./MakePrint";
import AddRide from "./AddRide";
import Account from "./Account";
import { addRide, removeRide, restoreRide, seedDemo, useStore, type Ride } from "@/lib/rides";
import { label, type Line } from "@/lib/lines";
import { todayKey } from "@/lib/dates";

type Tab = "today" | "prints" | "recaps";
type Page =
  | { kind: "ride"; day: string; rideId?: string; line?: Line }
  | { kind: "day"; day: string }
  | { kind: "make"; day: string }
  | { kind: "add"; day: string }
  | { kind: "account" };
export type Nav = { push: (p: Page) => void; pop: () => void; replace: (p: Page) => void; tab: (t: Tab) => void };

export default function App() {
  const { rides, settings } = useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [stack, setStack] = useState<Page[]>([]);
  const [today, setToday] = useState(todayKey());
  const [toastMsg, setToastMsg] = useState<{ msg: string; undo?: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // the day rolls over at midnight
  useEffect(() => {
    const id = setInterval(() => setToday(todayKey()), 60_000);
    if (new URLSearchParams(location.search).has("demo")) { seedDemo(); history.replaceState(null, "", location.pathname); }
    return () => clearInterval(id);
  }, []);

  // every new screen starts at the top
  useEffect(() => { window.scrollTo(0, 0); }, [stack.length, tab]);

  const toast = useCallback((msg: string, undo?: () => void) => {
    setToastMsg({ msg, undo });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 5000);
  }, []);

  const nav: Nav = {
    push: p => setStack(s => [...s, p]),
    pop: () => setStack(s => s.slice(0, -1)),
    replace: p => setStack(s => [...s.slice(0, -1), p]),
    tab: t => { setStack([]); setTab(t); },
  };

  const onLog = (l: Line) => {
    const r = addRide(today, l);
    toast(`Logged the ${label(l)}`, () => removeRide(r.id));
  };
  const onRemoved = (r: Ride) => toast(`Removed the ${label(r.line)}`, () => restoreRide(r));

  const page = stack[stack.length - 1];
  let view;
  if (page?.kind === "ride") view = <RideSheet key={page.rideId ?? page.line} day={page.day} ride={rides.find(r => r.id === page.rideId)} line={page.line} nav={nav} onRemoved={onRemoved} />;
  else if (page?.kind === "day") view = <DayPage day={page.day} today={today} rides={rides} nav={nav} onRemoved={onRemoved} />;
  else if (page?.kind === "make") view = <MakePrint day={page.day} rides={rides} nav={nav} toast={toast} />;
  else if (page?.kind === "add") view = <AddRide day={page.day} rides={rides} nav={nav} />;
  else if (page?.kind === "account") view = <Account rides={rides} settings={settings} nav={nav} toast={toast} />;
  else if (tab === "prints") view = <Prints rides={rides} today={today} nav={nav} />;
  else if (tab === "recaps") view = <Recaps rides={rides} today={today} />;
  else view = <Today rides={rides} day={today} nav={nav} onLog={onLog} />;

  return (
    <div className="app">
      <main className="view">{view}</main>
      {toastMsg && (
        <div className="toast" role="status">
          <span>{toastMsg.msg}</span>
          {toastMsg.undo && <button type="button" onClick={() => { toastMsg.undo?.(); setToastMsg(null); }}>Undo</button>}
        </div>
      )}
      {!page && (
        <nav className="tabs" aria-label="Sections">
          {(["today", "prints", "recaps"] as Tab[]).map(t => (
            <button key={t} type="button" aria-current={tab === t ? "page" : undefined} onClick={() => nav.tab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
          <i className="bar" style={{ transform: `translateX(${["today", "prints", "recaps"].indexOf(tab) * 100}%)` }} />
        </nav>
      )}
    </div>
  );
}
