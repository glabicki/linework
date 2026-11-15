"use client";
import { DayPrint } from "./art";
import { addDays, dateOf, keyOf, plural, weekStart } from "@/lib/dates";
import { yearCols } from "@/lib/recaps";
import { setSettings, useStore, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// 2026, Drawn. · so far: every day since the first ride, a print where you rode.
export default function YearSoFar({ rides, today, year: asked, nav, toast }: { rides: Ride[]; today: string; year?: number; nav: Nav; toast: (m: string) => void }) {
  const { settings } = useStore();
  const y = asked ?? dateOf(today).getFullYear();
  const done = `${y}-12-31` < today;
  const t = dateOf(done ? `${y}-12-31` : today);
  const days = Math.round((new Date(y + 1, 0, 1).getTime() - new Date(y, 0, 1).getTime()) / 864e5);
  const year = rides.filter(r => r.day.startsWith(String(y)));
  const first = year.reduce((a, r) => (r.day < a ? r.day : a), keyOf(t));
  const byDay = new Map<string, Ride[]>();
  year.forEach(r => byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]));
  const start = weekStart(first) < `${y}-01-01` ? `${y}-01-01` : weekStart(first);
  const cells = Math.round((t.getTime() - dateOf(start).getTime()) / 864e5) + 1;
  // Fewest columns (biggest prints) that still fit the screen; a week per row while it can.
  const cols = yearCols(cells);
  const dayIn = Math.round((t.getTime() - new Date(y, 0, 1).getTime()) / 864e5) + 1;

  return (
    <div className="year-page">
      <button type="button" className="year-close" onClick={nav.pop} aria-label="Close">×</button>
      <p className="kicker">{done ? `${y}, Drawn.` : `${y} so far`}</p>
      <h1>{plural(byDay.size, "print")}</h1>
      <div className={`year-grid${cols >= 8 ? " small" : ""}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label={`${plural(byDay.size, "day")} with rides out of ${plural(cells, "day")}`}>
        {[...Array(cells)].map((_, i) => {
          const k = addDays(start, i);
          const list = byDay.get(k);
          return list
            ? <span key={k} className="on"><DayPrint day={k} lines={list.map(r => r.line)} base={300} /></span>
            : <span key={k} />;
        })}
      </div>
      {done ? (
        <>
          <p className="year-lead">Your year, drawn. Every day you rode is here.</p>
          <button type="button" className="year-btn" onClick={nav.pop}>Done</button>
        </>
      ) : (
        <>
      <p className="year-lead">Still drawing. Your year opens January 1.</p>
      <p className="year-note">{dayIn} days in, {days - dayIn} to go. Every ride adds a print.</p>
      <button type="button" className="year-btn" onClick={() => {
        setSettings({ recaps: { ...settings.recaps, yearly: true } });
        toast("It’ll be waiting on Today, January 1.");
        nav.pop();
      }}>Remind me January 1</button>
        </>
      )}
    </div>
  );
}
