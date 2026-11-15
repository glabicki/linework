"use client";
import { DayCard, LineMark } from "./art";
import { ORDER, label, lineName, type Line } from "@/lib/lines";
import { DOWL, MONL, dateOf, plural, to12 } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export default function Today({ rides, day, nav, onLog }: { rides: Ride[]; day: string; nav: Nav; onLog: (l: Line) => void }) {
  const list = ridesOn(rides, day);
  const d = dateOf(day);
  const counts: Record<string, number> = {};
  list.forEach(r => (counts[r.line] = (counts[r.line] ?? 0) + 1));
  const min = minutes(list);

  return (
    <div className="screen">
      <header className="poster-head">
        <div>
          <h1 className="t-page">{DOWL[d.getDay()]}</h1>
          <p className="t-date">{MONL[d.getMonth()]} {d.getDate()}</p>
        </div>
        <button type="button" className="me" onClick={() => nav.push({ kind: "account" })} aria-label="Account">LW</button>
      </header>

      <div className="plate">
        <DayCard day={day} rides={list} onClick={() => nav.push({ kind: "day", day })} />
      </div>

      <div className="minutes" aria-live="polite">
        <span className="t-minutes">{min}</span>
        <span className="t-stat-label">minutes<br />underground</span>
      </div>

      <section className="picker" aria-label="Log a ride">
        <div className="picker-head">
          <h2 className="t-row">Tap a line you rode</h2>
          <span className="t-caption muted">{list.length ? plural(list.length, "ride") : ""}</span>
        </div>
        <div className="grid">
          {ORDER.map(l => {
            const n = counts[l] ?? 0;
            return (
              <button key={l} type="button" className={`cell${n ? " lit" : ""}`} onClick={() => onLog(l)}
                aria-label={`Log a ride on ${lineName(l)}${n ? `, ridden ${n === 1 ? "once" : n + " times"} today` : ""}`}>
                <span className="mark"><LineMark line={l} lit={!!n} />{n > 1 && <b className="x">{n}</b>}</span>
                <span className="lab">{label(l)}</span>
              </button>
            );
          })}
        </div>
        <p className="fine">
          {list.length
            ? list.map(r => (
                <button key={r.id} type="button" className="fine-ride" onClick={() => nav.push({ kind: "ride", day, rideId: r.id })}>
                  {r.time && <b>{to12(r.time)} </b>}
                  <span style={{ color: "var(--ui-text)" }}>{label(r.line)}</span>
                  {r.from && r.to ? `, ${r.from} to ${r.to}` : ""}, {r.est ? "about " : ""}{r.min} min.
                </button>
              ))
            : "Nothing yet. Tap a line you rode and the plotter draws it."}
        </p>
      </section>
    </div>
  );
}
