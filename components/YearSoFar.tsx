"use client";
import { DayPrint } from "./art";
import { MONL, dateOf, keyOf, plural } from "@/lib/dates";
import { setSettings, useStore, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// A whole year as twelve rows, one per month, a cell per day. Always the same size, so Year
// is always the smallest view. Used here, in Prints · Year and in the year story.
// `paper` draws the prints straight onto a white sheet, with no cells. `onMonth` makes each row a button.
export function YearGrid({ rides, y, today, onMonth, paper }: { rides: Ride[]; y: number; today: string; onMonth?: (m: number) => void; paper?: boolean; height?: number }) {
  const byDay = new Map<string, Ride[]>();
  rides.forEach(r => { if (r.day.startsWith(String(y))) byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]); });
  return (
    <div className={`year-grid${paper ? " paper" : ""}`} role="img" aria-label={`${plural(byDay.size, "day")} with rides in ${y}`}>
      {MONL.map((name, m) => {
        const days = new Date(y, m + 1, 0).getDate();
        const cells = [...Array(days)].map((_, i) => {
          const k = keyOf(new Date(y, m, i + 1)), list = byDay.get(k);
          return list ? <span key={k} className="on" data-day={k}><DayPrint day={k} legs={list} base={300} /></span> : <span key={k} className={k > today ? "later" : undefined} data-day={k} />;
        });
        const body = <><b>{name.slice(0, 1)}</b><span className="days">{cells}</span></>;
        return onMonth
          ? <button key={m} type="button" className="ym" onClick={() => onMonth(m)} aria-label={`Open ${name}`}>{body}</button>
          : <div key={m} className="ym">{body}</div>;
      })}
    </div>
  );
}

// 2026, Drawn. · so far: every day since the first ride, a print where you rode.
export default function YearSoFar({ rides, today, year: asked, nav, toast }: { rides: Ride[]; today: string; year?: number; nav: Nav; toast: (m: string) => void }) {
  const { settings } = useStore();
  const y = asked ?? dateOf(today).getFullYear();
  const done = `${y}-12-31` < today;
  const t = dateOf(done ? `${y}-12-31` : today);
  const days = Math.round((new Date(y + 1, 0, 1).getTime() - new Date(y, 0, 1).getTime()) / 864e5);
  const year = rides.filter(r => r.day.startsWith(String(y)));
  const prints = new Set(year.map(r => r.day)).size;
  const dayIn = Math.round((t.getTime() - new Date(y, 0, 1).getTime()) / 864e5) + 1;

  return (
    <div className="year-page">
      <button type="button" className="year-close" onClick={nav.pop} aria-label="Close">×</button>
      <p className="kicker">{done ? `${y}, Drawn.` : `${y} so far`}</p>
      <h1>{plural(prints, "print")}</h1>
      <YearGrid rides={rides} y={y} today={today} />
      {done ? (
        <>
          <p className="year-lead">Your year, drawn. Every day you rode is here.</p>
          <button type="button" className="year-btn" onClick={() => nav.replace({ kind: "story", year: y })}>Play your year</button>
          <button type="button" className="year-link" onClick={nav.pop}>Done</button>
        </>
      ) : (
        <>
      <p className="year-lead">Still drawing. Your year opens January 1.</p>
      <p className="year-note">{dayIn} days in, {days - dayIn} to go. Every ride adds a print.</p>
      <button type="button" className="year-btn" onClick={() => {
        setSettings({ recaps: { ...settings.recaps, yearly: true } });
        toast("It’ll be waiting for you January 1.");
        nav.pop();
      }}>Remind me January 1</button>
        </>
      )}
    </div>
  );
}
