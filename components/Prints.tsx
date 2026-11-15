"use client";
import { useState } from "react";
import { DayCard } from "./art";
import { MON, MONL, addDays, dateOf, keyOf, weekStart } from "@/lib/dates";
import { linesOf, minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

function Stats({ list }: { list: Ride[] }) {
  const m = minutes(list);
  return (
    <div className="stats">
      <div><b className="t-stat">{list.length}</b><span className="t-caption muted">rides</span></div>
      <div><b className="t-stat">{m < 60 ? `${m} min` : `${Math.round(m / 60)} h`}</b><span className="t-caption muted">underground</span></div>
      <div><b className="t-stat">{linesOf(list).length}</b><span className="t-caption muted">lines</span></div>
    </div>
  );
}

export default function Prints({ rides, today, nav }: { rides: Ride[]; today: string; nav: Nav }) {
  const [view, setView] = useState<"week" | "month">("week");
  const [wk, setWk] = useState(weekStart(today));
  const t = dateOf(today);
  const [mo, setMo] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const first = rides.length ? rides.reduce((a, r) => (r.day < a ? r.day : a), today) : today;
  const open = (day: string) => nav.push({ kind: "day", day });

  if (!rides.length) {
    return (
      <div className="screen">
        <header className="tab-head"><h1 className="t-page">Prints</h1></header>
        <div className="empty">
          <div className="empty-card" />
          <h2 className="t-title">No prints yet.</h2>
          <p className="t-caption muted">Every day you ride becomes a print. Log a ride and today’s starts drawing.</p>
          <button type="button" className="btn" onClick={() => nav.tab("today")}>Log a ride</button>
        </div>
      </div>
    );
  }

  let body, range, sub, inRange: Ride[], prevOk: boolean, nextOk: boolean, step: (n: number) => void;
  if (view === "week") {
    const keys = [...Array(7)].map((_, i) => addDays(wk, i));
    const a = dateOf(keys[0]), b = dateOf(keys[6]);
    range = `${MON[a.getMonth()]} ${a.getDate()} – ${a.getMonth() === b.getMonth() ? "" : MON[b.getMonth()] + " "}${b.getDate()}`;
    sub = wk === weekStart(today) ? "This week" : wk === addDays(weekStart(today), -7) ? "Last week" : "";
    inRange = rides.filter(r => r.day >= keys[0] && r.day <= keys[6]);
    prevOk = keys[0] > first; nextOk = keys[6] < today;
    step = n => setWk(addDays(wk, 7 * n));
    body = (
      <div className="week">
        {keys.map(k => {
          const list = ridesOn(rides, k);
          if (k > today) return <div key={k} className="cell-off"><span className="t-tab muted">{dateOf(k).getDate()}</span><span className="t-tab muted">To come</span></div>;
          if (!list.length) return <div key={k} className="cell-off"><span className="t-tab muted">{dateOf(k).getDate()}</span><span className="t-tab muted">Off</span></div>;
          return <DayCard key={k} day={k} rides={list} size="small" onClick={() => open(k)} />;
        })}
      </div>
    );
  } else {
    const days = new Date(mo.y, mo.m + 1, 0).getDate();
    const lead = (new Date(mo.y, mo.m, 1).getDay() + 6) % 7;
    const keys = [...Array(days)].map((_, i) => keyOf(new Date(mo.y, mo.m, i + 1)));
    range = `${MONL[mo.m]} ${mo.y}`;
    sub = mo.y === t.getFullYear() && mo.m === t.getMonth() ? "This month" : mo.y === t.getFullYear() && mo.m === t.getMonth() - 1 ? "Last month" : "";
    inRange = rides.filter(r => r.day >= keys[0] && r.day <= keys[keys.length - 1]);
    prevOk = keys[0] > first; nextOk = keys[keys.length - 1] < today;
    step = n => setMo(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    body = (
      <div className="month">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <span key={i} className="t-tab muted wd">{w}</span>)}
        {[...Array(lead)].map((_, i) => <span key={"l" + i} />)}
        {keys.map(k => {
          const list = ridesOn(rides, k);
          return (
            <div key={k} className="mday">
              {list.length ? <DayCard day={k} rides={list} size="tiny" onClick={() => open(k)} /> : <span className={`mblank${k > today ? " later" : ""}`} />}
              <span className="t-tab muted">{dateOf(k).getDate()}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="tab-head"><h1 className="t-page">Prints</h1></header>
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={view === "week"} onClick={() => setView("week")}>Week</button>
        <button type="button" role="tab" aria-selected={view === "month"} onClick={() => setView("month")}>Month</button>
      </div>
      <div className="range">
        <button type="button" onClick={() => step(-1)} disabled={!prevOk} aria-label={`Previous ${view}`}>‹</button>
        <div><b className="t-title">{range}</b>{sub && <span className="t-caption muted">{sub}</span>}</div>
        <button type="button" onClick={() => step(1)} disabled={!nextOk} aria-label={`Next ${view}`}>›</button>
      </div>
      <div className="rule" />
      <Stats list={inRange} />
      {body}
    </div>
  );
}
