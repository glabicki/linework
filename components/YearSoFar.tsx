"use client";
import { DayPrint } from "./art";
import { MON, addDays, dateOf, plural } from "@/lib/dates";
import { setSettings, useStore, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// Figma 173:3089 2026, Drawn. · Not ready yet (before Jan 1)
export default function YearSoFar({ rides, today, nav, toast }: { rides: Ride[]; today: string; nav: Nav; toast: (m: string) => void }) {
  const { settings } = useStore();
  const t = dateOf(today);
  const y = t.getFullYear();
  const jan1 = `${y}-01-01`;
  const days = Math.round((new Date(y + 1, 0, 1).getTime() - new Date(y, 0, 1).getTime()) / 864e5);
  const year = rides.filter(r => r.day.startsWith(String(y)));
  const byDay = new Map<string, Ride[]>();
  year.forEach(r => byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]));
  const dayIn = Math.round((t.getTime() - new Date(y, 0, 1).getTime()) / 864e5) + 1;

  return (
    <div className="year-page">
      <button type="button" className="year-close" onClick={nav.pop} aria-label="Close">×</button>
      <i className="year-rule" />
      <h1>{y},<br />Drawn.</h1>
      <div className="year-sheet">
        <div className="tick"><b>{MON[t.getMonth()].toUpperCase()} {t.getDate()}</b><span>{plural(year.length, "ride")} so far</span></div>
        <div className="year-grid" role="img" aria-label={`${y} so far: ${plural(byDay.size, "day")} with rides`}>
          {[...Array(days)].map((_, i) => {
            const k = addDays(jan1, i);
            const list = byDay.get(k);
            if (list) return <span key={k}><DayPrint day={k} lines={list.map(r => r.line)} /></span>;
            return <span key={k} className={k > today ? "later" : "off"} />;
          })}
        </div>
      </div>
      <p className="year-lead">Still drawing. Your year opens January 1.</p>
      <p className="year-note">{dayIn} days in, {days - dayIn} to go. Every ride lands on this sheet.</p>
      <button type="button" className="year-btn" onClick={() => {
        setSettings({ recaps: { ...settings.recaps, yearly: true } });
        toast("We’ll remind you January 1.");
        nav.pop();
      }}>Remind me January 1</button>
    </div>
  );
}

