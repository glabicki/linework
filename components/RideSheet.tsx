"use client";
import { useState } from "react";
import { LineMark } from "./art";
import { LineTitle, STATIONS, label, serviceNote, typicalMin, type Line } from "@/lib/lines";
import { dayLong, isWeekend } from "@/lib/dates";
import { addRide, removeRide, timing, updateRide, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export default function RideSheet({ day, ride, line, nav, onRemoved }: { day: string; ride?: Ride; line?: Line; nav: Nav; onRemoved: (r: Ride) => void }) {
  const l = (ride?.line ?? line)!;
  const [time, setTime] = useState(ride?.time ?? "");
  const [from, setFrom] = useState(ride?.from ?? "");
  const [to, setTo] = useState(ride?.to ?? "");
  const t = timing(l, from || undefined, to || undefined);
  const stations = STATIONS[l] ?? [];
  const note = serviceNote(l, isWeekend(day), dayLong(day));
  const isNew = !ride;

  const save = () => {
    const patch = { time: time || undefined, from: from || undefined, to: to || undefined };
    if (isNew) addRide(day, l, patch); else updateRide(ride.id, patch);
    nav.pop();
  };

  return (
    <div className="screen page">
      <button type="button" className="back" onClick={nav.pop} aria-label="Back">‹</button>
      <div className="ride-mark"><LineMark line={l} lit size={44} /><span className="t-tab">{label(l)}</span></div>
      <h1 className="t-large">{LineTitle(l)}</h1>
      <p className="t-caption muted">{isNew ? "New ride · " : ""}{dayLong(day)}</p>
      <div className="rule" />

      <label className="row">
        <span className="txt"><b className="t-headline">Time</b><span className="t-caption muted">Optional. The day is what counts.</span></span>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Time" />
      </label>
      <label className="row">
        <span className="txt"><b className="t-headline">From</b><span className="t-caption muted">Optional</span></span>
        <select value={from} onChange={e => setFrom(e.target.value)} aria-label="From station">
          <option value="">Not set</option>
          {stations.map(s => <option key={s[0]}>{s[0]}</option>)}
        </select>
      </label>
      <label className="row">
        <span className="txt"><b className="t-headline">To</b><span className="t-caption muted">Optional</span></span>
        <select value={to} onChange={e => setTo(e.target.value)} aria-label="To station">
          <option value="">Not set</option>
          {stations.map(s => <option key={s[0]}>{s[0]}</option>)}
        </select>
      </label>
      <div className="row">
        <span className="txt">
          <b className="t-headline">{t.est ? `About ${typicalMin(l)} min` : `${t.min} min`}</b>
          <span className="t-caption muted">{t.est ? `A typical ${label(l)} ride. Add stations for the scheduled time.` : "Scheduled time between these stations, from the MTA timetable."}</span>
        </span>
      </div>
      {note && (
        <>
          <div className="rule" />
          <div className="row"><span className="txt"><b className="t-headline">{note.split(".")[0]}</b><span className="t-caption muted">{note.split(". ").slice(1).join(". ")}</span></span></div>
        </>
      )}

      <footer className="foot">
        {isNew && <p className="t-caption muted center">Time and stations are optional.</p>}
        <button type="button" className="btn" onClick={save}>{isNew ? "Log ride" : "Done"}</button>
        {isNew
          ? <button type="button" className="link center" onClick={nav.pop}>Cancel</button>
          : <button type="button" className="link center" onClick={() => { const r = removeRide(ride.id); nav.pop(); if (r) onRemoved(r); }}>Remove ride</button>}
      </footer>
    </div>
  );
}
