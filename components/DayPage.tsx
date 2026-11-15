"use client";
import { DayCard, LineMark } from "./art";
import { label, lineName } from "@/lib/lines";
import { DOWL, dateOf, fmtH, monthDay, plural, to12 } from "@/lib/dates";
import { minutes, removeRide, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export default function DayPage({ day, today, rides, nav, onRemoved }: { day: string; today: string; rides: Ride[]; nav: Nav; onRemoved: (r: Ride) => void }) {
  const list = ridesOn(rides, day);
  const m = minutes(list);
  const d = dateOf(day);
  const est = list.some(r => r.est);
  return (
    <div className="screen page">
      <button type="button" className="back" onClick={nav.pop} aria-label="Back">‹</button>
      <h1 className="t-large">{monthDay(day)}</h1>
      <p className="t-caption muted">
        {DOWL[d.getDay()]}{day === today ? " · today" : ""} · {list.length ? `${plural(list.length, "ride")} · ${est ? "about " : ""}${fmtH(m)} underground` : "no rides yet"}
      </p>
      <div className="day-card"><DayCard day={day} rides={list} size="large" /></div>
      <div className="rule" />
      {list.map(r => (
        <div key={r.id} className="ride-row">
          <button type="button" className="ride-tap" onClick={() => nav.push({ kind: "ride", day, rideId: r.id })}>
            <LineMark line={r.line} lit size={28} />
            <span className="txt">
              <b className="t-headline">{r.from && r.to ? `${label(r.line)}  ${r.from} → ${r.to}` : `Ride on ${lineName(r.line)}`}</b>
              <span className="t-caption muted">{[to12(r.time), `${r.est ? "about " : ""}${r.min} min`].filter(Boolean).join(" · ")}</span>
            </span>
          </button>
          <button type="button" className="x-btn" aria-label={`Remove ${label(r.line)} ride`} onClick={() => { const x = removeRide(r.id); if (x) onRemoved(x); }}>×</button>
        </div>
      ))}
      {!list.length && <p className="t-caption muted">{day === today ? "Nothing yet. Tap a line you rode and the plotter draws it." : "Nothing logged this day. Forgot? Add the lines you rode; no time needed."}</p>}
      <footer className="foot">
        {list.length > 0 && <p className="t-caption muted center">Tap a ride to add a time or stations. × takes it off the print, and Undo puts it back.</p>}
        {list.length > 0 && <button type="button" className="btn" onClick={() => nav.push({ kind: "make", day })}>Make a print</button>}
        <button type="button" className="link" onClick={() => nav.push({ kind: "add", day })}>Add a ride</button>
      </footer>
    </div>
  );
}
