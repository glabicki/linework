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
import Onboarding from "./Onboarding";
import YearSoFar from "./YearSoFar";
import YearStory from "./YearStory";
import HomeScreen from "./HomeScreen";
import Intro from "./Intro";
import RecapCard from "./RecapCard";
import { backupDue, dueCards } from "@/lib/recaps";
import { addRide, removeRide, restoreRide, seedDemo, useStore, type Ride } from "@/lib/rides";
import { label, stationName, type Line } from "@/lib/lines";
import { usualStretch, type Stretch } from "@/lib/usual";
import { todayKey } from "@/lib/dates";

type Tab = "today" | "prints" | "recaps" | "account";
type Page =
  | { kind: "ride"; day: string; rideId?: string; line?: Line }
  | { kind: "day"; day: string }
  | { kind: "make"; day: string; year?: number }
  | { kind: "add"; day: string }
  | { kind: "year"; year?: number }
  | { kind: "story"; year: number }
  | { kind: "home" };
export type Nav = { push: (p: Page) => void; pop: () => void; replace: (p: Page) => void; tab: (t: Tab, at?: string) => void };

export default function App() {
  const { rides, settings } = useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [at, setAt] = useState<string>(); // a week to open Prints on
  const [stack, setStack] = useState<Page[]>([]);
  const [today, setToday] = useState(todayKey());
  const [toastMsg, setToastMsg] = useState<{ msg: string; undo?: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [mounted, setMounted] = useState(false);
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    setMounted(true);
    // The intro plays once each time the app is opened (a new session), never with reduce motion on.
    try {
      if (!sessionStorage.getItem("lw-intro") && !matchMedia("(prefers-reduced-motion: reduce)").matches) setIntro(true);
      sessionStorage.setItem("lw-intro", "1");
    } catch {}
  }, []);
  const introEl = intro && <Intro onDone={() => setIntro(false)} />;

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
    tab: (t, a) => { setStack([]); setTab(t); setAt(a); },
  };

  // A tap logs your usual stretch on that line when you have one, so the print draws just that.
  const onLog = (l: Line, stretch?: Stretch) => {
    const first = !rides.length;
    const now = new Date();
    const s = stretch ?? usualStretch(l, rides, today, now.getHours() * 60 + now.getMinutes());
    const r = addRide(today, l, s ?? {});
    // The first ride also teaches press and hold.
    toast(first ? `Logged the ${label(l)}. Press and hold a line to add a time.`
      : s ? `Logged the ${label(l)}, ${stationName(s.from)} to ${stationName(s.to)}` : `Logged the ${label(l)}`, () => removeRide(r.id));
  };
  const onRemoved = (r: Ride) => toast(`Removed the ${label(r.line)}`, () => restoreRide(r));

  const page = stack[stack.length - 1];
  const due = backupDue(new Date(), rides, settings);
  let view;
  if (page?.kind === "ride") view = <RideSheet key={page.rideId ?? page.line} day={page.day} rides={rides} ride={rides.find(r => r.id === page.rideId)} line={page.line} nav={nav} onRemoved={onRemoved} />;
  else if (page?.kind === "day") view = <DayPage day={page.day} today={today} rides={rides} nav={nav} onRemoved={onRemoved} />;
  else if (page?.kind === "make") view = <MakePrint day={page.day} year={page.year} rides={rides} nav={nav} toast={toast} />;
  else if (page?.kind === "add") view = <AddRide day={page.day} rides={rides} nav={nav} />;
  else if (page?.kind === "year") view = <YearSoFar rides={rides} today={today} year={page.year} nav={nav} toast={toast} />;
  else if (page?.kind === "story") view = <YearStory key={page.year} rides={rides} today={today} year={page.year} nav={nav} toast={toast} />;
  else if (page?.kind === "home") view = <HomeScreen nav={nav} />;
  else if (tab === "prints") view = <Prints key={at ?? "now"} at={at} rides={rides} today={today} nav={nav} />;
  else if (tab === "recaps") view = <Recaps rides={rides} today={today} nav={nav} />;
  else if (tab === "account") view = <Account rides={rides} settings={settings} nav={nav} toast={toast} due={due} />;
  else {
    const card = dueCards(new Date(), rides, settings)[0];
    view = <Today rides={rides} day={today} mine={settings.lines} nav={nav} onLog={onLog} recap={card && <RecapCard card={card} nav={nav} />} />;
  }

  if (!mounted) return <div className="app" />;
  if (!settings.onboarded && !rides.length) return <div className="app"><main className="view"><Onboarding settings={settings} /></main>{introEl}</div>;

  return (
    <div className="app">
      {introEl}
      <main className={page ? "view" : "view has-tabs"}>{view}</main>
      {toastMsg && (
        <div className="toast" role="status">
          <span>{toastMsg.msg}</span>
          {toastMsg.undo && <button type="button" onClick={() => { toastMsg.undo?.(); setToastMsg(null); }}>Undo</button>}
        </div>
      )}
      {!page && (
        <nav className="tabs" aria-label="Sections">
          {(["today", "prints", "recaps", "account"] as Tab[]).map(t => (
            <button key={t} type="button" aria-current={tab === t ? "page" : undefined} onClick={() => nav.tab(t)}
              aria-label={t === "account" && due ? "Account, backup due" : undefined}>
              {t[0].toUpperCase() + t.slice(1)}{t === "account" && due && <i className="due" aria-hidden="true" />}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
