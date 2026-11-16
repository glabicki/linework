"use client";
import { LineMark } from "./art";
import { Back } from "./RideSheet";
import { ORDER, label, lineName } from "@/lib/lines";
import { dayLong } from "@/lib/dates";
import { ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// Figma 114:1337 Day · Add a ride
export default function AddRide({ day, rides, nav }: { day: string; rides: Ride[]; nav: Nav }) {
  const have = new Set(ridesOn(rides, day).map(r => r.line));
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="page-copy">
        <h1 className="t-large">Add a ride</h1>
        <p>To {dayLong(day)}. No time needed. Tap the line you rode.</p>
      </div>
      <div className="grid">
        {ORDER.map(l => (
          <button key={l} type="button" className={`cell${have.has(l) ? " lit" : ""}`} aria-label={`Add a ${lineName(l)} ride`}
            onClick={() => nav.replace({ kind: "ride", day, line: l, land: true })}>
            <span className="mark"><LineMark line={l} lit={have.has(l)} /></span>
            <span className="lab">{label(l)}</span>
          </button>
        ))}
      </div>
      <footer className="sheet-foot"><p className="hint soft">Adds to that day’s print.</p></footer>
    </div>
  );
}
