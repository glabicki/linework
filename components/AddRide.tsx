"use client";
import { LineMark } from "./art";
import { ORDER, label, lineName } from "@/lib/lines";
import { dayLong } from "@/lib/dates";
import { ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export default function AddRide({ day, rides, nav }: { day: string; rides: Ride[]; nav: Nav }) {
  const have = new Set(ridesOn(rides, day).map(r => r.line));
  return (
    <div className="screen page">
      <button type="button" className="back" onClick={nav.pop} aria-label="Back">‹</button>
      <h1 className="t-title">Add a ride</h1>
      <p className="t-caption muted">To {dayLong(day)}. No time needed. Tap the line you rode.</p>
      <div className="grid">
        {ORDER.map(l => (
          <button key={l} type="button" className={`cell${have.has(l) ? " lit" : ""}`} aria-label={`Add a ${lineName(l)} ride`}
            onClick={() => nav.replace({ kind: "ride", day, line: l })}>
            <span className="mark"><LineMark line={l} lit={have.has(l)} /></span>
            <span className="lab">{label(l)}</span>
          </button>
        ))}
      </div>
      <p className="t-caption muted center foot-note">Adds to that day’s print.</p>
    </div>
  );
}
