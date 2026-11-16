"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { DayCard } from "./art";
import { YearGrid } from "./YearSoFar";
import { Icon } from "./icons";
import { MON, MONL, addDays, dateOf, dayShort, keyOf, plural, weekStart } from "@/lib/dates";
import { linesOf, minutes, ridesOn, useStore, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export function TabHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return <header className="tab-head"><h1 className="t-page">{title}</h1>{children}</header>;
}

function Stats({ list }: { list: Ride[] }) {
  const m = minutes(list);
  return (
    <div className="stats">
      <div><b>{list.length}</b><span>rides</span></div>
      <div><b>{m < 60 ? `${m} min` : `${Math.round(m / 60)} h`}</b><span>underground</span></div>
      <div><b>{linesOf(list).length}</b><span>lines</span></div>
    </div>
  );
}

// How far back the Prints tab goes: any week, month or year since 2000, rides or not, so old days can be filled in.
const FLOOR = "2000-01-01";

// Figma 30:206 Week, 32:236 Month, 175:3681 No prints yet
export default function Prints({ rides, today, nav, at }: { rides: Ride[]; today: string; nav: Nav; at?: string }) {
  const [view, setView] = useState<"week" | "month" | "year">("week");
  const [yr, setYr] = useState(dateOf(today).getFullYear());
  const [wk, setWk] = useState(at ?? weekStart(today));
  const t = dateOf(today);
  const [mo, setMo] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const open = (day: string) => nav.push({ kind: "day", day });
  const { notes } = useStore();

  // Switching Week, Month and Year: each day's print glides from where it was to where it lands,
  // so the views read as one sheet zooming out and in. Days new to the view fade in.
  const sheet = useRef<HTMLDivElement>(null);
  const snap = useRef<Map<string, DOMRect> | null>(null);
  const go = (v: typeof view) => {
    if (v === view) return;
    const m = new Map<string, DOMRect>();
    sheet.current?.querySelectorAll<HTMLElement>("[data-day]").forEach(el => { const r = el.getBoundingClientRect(); if (r.width) m.set(el.dataset.day!, r); });
    snap.current = m;
    setView(v);
  };
  useLayoutEffect(() => {
    const old = snap.current;
    snap.current = null;
    if (!old || !sheet.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    sheet.current.querySelectorAll<HTMLElement>("[data-day]").forEach(el => {
      const r = el.getBoundingClientRect(), o = old.get(el.dataset.day!);
      if (!r.width) return;
      if (o) {
        el.animate([
          { transformOrigin: "0 0", transform: `translate(${o.left - r.left}px, ${o.top - r.top}px) scale(${o.width / r.width}, ${o.height / r.height})` },
          { transformOrigin: "0 0", transform: "none" },
        ], { duration: 520, easing: "cubic-bezier(.2, .8, .2, 1)" });
      } else {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: 220, fill: "backwards" });
      }
    });
  }, [view]);

  if (!rides.length) {
    return (
      <div className="tab">
        <TabHead title="Prints" />
        <div className="empty">
          <div className="empty-card" />
          <h2>No prints yet.</h2>
          <p>Every day you ride becomes a print. Log a ride and today’s starts drawing.</p>
          <button type="button" className="btn btn-sm" onClick={() => nav.tab("today")}>Log a ride</button>
        </div>
      </div>
    );
  }

  let body, range, sub, start: string, inRange: Ride[], prevOk: boolean, nextOk: boolean, step: (n: number) => void;
  if (view === "week") {
    const keys = [...Array(7)].map((_, i) => addDays(wk, i));
    const a = dateOf(keys[0]), b = dateOf(keys[6]);
    range = `${MON[a.getMonth()]} ${a.getDate()} – ${a.getMonth() === b.getMonth() ? "" : MON[b.getMonth()] + " "}${b.getDate()}${b.getFullYear() === t.getFullYear() ? "" : `, ${b.getFullYear()}`}`;
    sub = wk === weekStart(today) ? "This week" : wk === addDays(weekStart(today), -7) ? "Last week" : "";
    inRange = rides.filter(r => r.day >= keys[0] && r.day <= keys[6]);
    start = keys[0]; prevOk = keys[0] > FLOOR; nextOk = keys[6] < today;
    step = n => setWk(w => addDays(w, 7 * n));
    body = (
      <div className="week">
        {keys.map(k => {
          const list = ridesOn(rides, k);
          return (
            <div key={k} className="wday">
              {list.length || notes[k] ? <DayCard day={k} rides={list} size="plain" onClick={() => open(k)} flip /> : k > today ? <span className="blank later" data-day={k} /> : <button type="button" className="blank" data-day={k} aria-label={`Add rides for ${dayShort(k)}`} onClick={() => nav.push({ kind: "add", day: k })} />}
              <div className="wlab"><b>{dayShort(k)}</b><span>{k > today ? "" : list.length ? plural(list.length, "ride") : ""}</span></div>
            </div>
          );
        })}
      </div>
    );
  } else if (view === "year") {
    range = String(yr);
    sub = yr === t.getFullYear() ? "This year" : "";
    inRange = rides.filter(r => r.day.startsWith(String(yr)));
    start = `${yr}-01-01`; prevOk = start > FLOOR; nextOk = yr < t.getFullYear();
    step = n => setYr(y => y + n);
    body = <YearGrid rides={rides} y={yr} today={today} onMonth={m => { setMo({ y: yr, m }); go("month"); }} />;
  } else {
    const days = new Date(mo.y, mo.m + 1, 0).getDate();
    const lead = (new Date(mo.y, mo.m, 1).getDay() + 6) % 7;
    const keys = [...Array(days)].map((_, i) => keyOf(new Date(mo.y, mo.m, i + 1)));
    range = `${MONL[mo.m]} ${mo.y}`;
    sub = mo.y === t.getFullYear() && mo.m === t.getMonth() ? "This month" : mo.y === t.getFullYear() && mo.m === t.getMonth() - 1 ? "Last month" : "";
    inRange = rides.filter(r => r.day >= keys[0] && r.day <= keys[keys.length - 1]);
    start = keys[0]; prevOk = keys[0] > FLOOR; nextOk = keys[keys.length - 1] < today;
    step = n => setMo(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    body = (
      <div className="month">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <span key={i} className="wd">{w}</span>)}
        {[...Array(lead)].map((_, i) => <span key={"l" + i} />)}
        {keys.map(k => {
          const list = ridesOn(rides, k);
          return (
            <div key={k} className="mday">
              {list.length || notes[k] ? <DayCard day={k} rides={list} size="plain" onClick={() => open(k)} flip /> : k > today ? <span className="blank later" data-day={k} /> : <button type="button" className="blank" data-day={k} aria-label={`Add rides for ${dayShort(k)}`} onClick={() => nav.push({ kind: "add", day: k })} />}
              <span>{dateOf(k).getDate()}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="tab">
      <TabHead title="Prints" />
      <div className="prints-body">
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={view === "week"} onClick={() => go("week")}>Week</button>
          <button type="button" role="tab" aria-selected={view === "month"} onClick={() => go("month")}>Month</button>
          <button type="button" role="tab" aria-selected={view === "year"} onClick={() => go("year")}>Year</button>
        </div>
        <div className="range">
          <button type="button" onClick={() => step(-1)} disabled={!prevOk} aria-label={`Previous ${view}`}><Icon name="left" /></button>
          <div>
            {/* Tapping the range opens a date picker, to jump straight to any week, month or year. */}
            <label className="range-pick">
              <b>{range}</b>
              <input type="date" min={FLOOR} max={today} value={start} aria-label={`Pick a ${view}`}
                onClick={e => { try { e.currentTarget.showPicker?.(); } catch { /* not allowed here */ } }}
                onChange={e => { const d = e.target.value; if (!d) return; const x = dateOf(d); if (view === "week") setWk(weekStart(d)); else if (view === "month") setMo({ y: x.getFullYear(), m: x.getMonth() }); else setYr(x.getFullYear()); }} />
            </label>
            {sub ? <span>{sub}</span> : <button type="button" className="range-now" onClick={() => { setWk(weekStart(today)); setMo({ y: t.getFullYear(), m: t.getMonth() }); setYr(t.getFullYear()); }}>Back to this {view}</button>}
          </div>
          <button type="button" onClick={() => step(1)} disabled={!nextOk} aria-label={`Next ${view}`}><Icon name="right" /></button>
        </div>
        <Stats list={inRange} />
        <div ref={sheet}>{body}</div>
      </div>
    </div>
  );
}
