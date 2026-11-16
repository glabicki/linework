"use client";
import { useState } from "react";
import { DayCard } from "./art";
import { YearGrid } from "./YearSoFar";
import { Icon } from "./icons";
import { MON, MONL, addDays, dateOf, dayShort, keyOf, plural, weekStart } from "@/lib/dates";
import { linesOf, minutes, ridesOn, type Ride } from "@/lib/rides";
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

// Figma 30:206 Week, 32:236 Month, 175:3681 No prints yet
export default function Prints({ rides, today, nav, at }: { rides: Ride[]; today: string; nav: Nav; at?: string }) {
  const [view, setView] = useState<"week" | "month" | "year">("week");
  const [yr, setYr] = useState(dateOf(today).getFullYear());
  const [wk, setWk] = useState(at ?? weekStart(today));
  const t = dateOf(today);
  const [mo, setMo] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const first = rides.length ? rides.reduce((a, r) => (r.day < a ? r.day : a), today) : today;
  const open = (day: string) => nav.push({ kind: "day", day });

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
          return (
            <div key={k} className="wday">
              {list.length ? <DayCard day={k} rides={list} size="plain" onClick={() => open(k)} /> : k > today ? <span className="blank later" /> : <button type="button" className="blank" aria-label={`Add rides for ${dayShort(k)}`} onClick={() => nav.push({ kind: "add", day: k })} />}
              <div className="wlab"><b>{dayShort(k)}</b><span>{k > today ? "" : list.length ? plural(list.length, "ride") : "Off"}</span></div>
            </div>
          );
        })}
      </div>
    );
  } else if (view === "year") {
    range = String(yr);
    sub = yr === t.getFullYear() ? "This year" : "";
    inRange = rides.filter(r => r.day.startsWith(String(yr)));
    prevOk = `${yr}-01-01` > first; nextOk = yr < t.getFullYear();
    step = n => setYr(yr + n);
    body = <YearGrid rides={rides} y={yr} today={today} onMonth={m => { setMo({ y: yr, m }); setView("month"); }} />;
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
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <span key={i} className="wd">{w}</span>)}
        {[...Array(lead)].map((_, i) => <span key={"l" + i} />)}
        {keys.map(k => {
          const list = ridesOn(rides, k);
          return (
            <div key={k} className="mday">
              {list.length ? <DayCard day={k} rides={list} size="plain" onClick={() => open(k)} /> : k > today ? <span className="blank later" /> : <button type="button" className="blank" aria-label={`Add rides for ${dayShort(k)}`} onClick={() => nav.push({ kind: "add", day: k })} />}
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
          <button type="button" role="tab" aria-selected={view === "week"} onClick={() => setView("week")}>Week</button>
          <button type="button" role="tab" aria-selected={view === "month"} onClick={() => setView("month")}>Month</button>
          <button type="button" role="tab" aria-selected={view === "year"} onClick={() => setView("year")}>Year</button>
        </div>
        <div className="range">
          <button type="button" onClick={() => step(-1)} disabled={!prevOk} aria-label={`Previous ${view}`}><Icon name="left" /></button>
          <div><b>{range}</b>{sub && <span>{sub}</span>}</div>
          <button type="button" onClick={() => step(1)} disabled={!nextOk} aria-label={`Next ${view}`}><Icon name="right" /></button>
        </div>
        <Stats list={inRange} />
        {body}
      </div>
    </div>
  );
}
