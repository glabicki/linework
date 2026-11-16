"use client";
import { useState } from "react";
import { LineMark } from "./art";
import { Icon } from "./icons";
import { LineTitle, STATIONS, label, stationName, serviceNote, typicalMin, type Line } from "@/lib/lines";
import { dayLong, isWeekend, to12 } from "@/lib/dates";
import { addRide, removeRide, timing, updateRide, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

export function Back({ onClick }: { onClick: () => void }) {
  return (
    <div className="topbar">
      <button type="button" className="back" onClick={onClick} aria-label="Back">
        <Icon name="left" />
      </button>
    </div>
  );
}

// Figma 114:1120 Ride · Edit and 114:1226 Ride · New
export default function RideSheet({ day, rides, ride, line, land, nav, onRemoved }: { day: string; rides: Ride[]; ride?: Ride; line?: Line; land?: boolean; nav: Nav; onRemoved: (r: Ride) => void }) {
  const l = (ride?.line ?? line)!;
  const [time, setTime] = useState(ride?.time ?? "");
  const [from, setFrom] = useState(ride?.from ?? "");
  const [to, setTo] = useState(ride?.to ?? "");
  const t = timing(l, from || undefined, to || undefined);
  const stations = STATIONS[l] ?? [];
  const note = serviceNote(l, isWeekend(day));
  const isNew = !ride;
  // Figma 129:1858: a long-press on a line already ridden today can take the last one back off.
  const lastToday = isNew ? rides.filter(r => r.day === day && r.line === l).sort((a, b) => b.at - a.at)[0] : undefined;
  const remove = (id: string) => { const r = removeRide(id); nav.pop(); if (r) onRemoved(r); };

  const save = () => {
    const patch = { time: time || undefined, from: from || undefined, to: to || undefined };
    if (isNew) addRide(day, l, patch); else updateRide(ride.id, patch);
    // A ride added from "Add a ride" lands on the day's print, where Add a ride is one tap away.
    if (isNew && land) nav.land(day); else nav.pop();
  };

  const station = (v: string, set: (s: string) => void, name: string) => (
    <span className="val">
      {v ? stationName(v) : "Not set"}
      <select value={v} onChange={e => set(e.target.value)} aria-label={name}>
        <option value="">Not set</option>
        {stations.map(s => <option key={s[0]} value={s[0]}>{stationName(s[0])}</option>)}
      </select>
    </span>
  );

  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="sheet-copy">
        <div className="sheet-mark"><LineMark line={l} lit size={56} /></div>
        <h1 className="t-page" style={{ color: "var(--ui-text)" }}>{LineTitle(l)}</h1>
        <p className="t-body muted">{isNew ? "New ride · " : ""}{dayLong(day)}</p>
      </div>
      <div className="sheet-rows">
        <i className="hr" />
        <label className="frow">
          <span className="txt"><b>Time</b><span>Optional. The day is what counts.</span></span>
          <span className="val">{time ? to12(time) : "Not set"}<input type="time" value={time} onChange={e => setTime(e.target.value)} aria-label="Time" /></span>
        </label>
        <label className="frow">
          <span className="txt"><b>From</b><span>Optional</span></span>
          {station(from, setFrom, "From station")}
        </label>
        <label className="frow">
          <span className="txt"><b>To</b><span>Optional</span></span>
          {station(to, setTo, "To station")}
        </label>
        <div className="frow">
          <span className="txt">
            <b>{t.est ? `About ${typicalMin(l)} min` : `${t.min} min`}</b>
            <span>{t.est ? `A typical ${label(l)} ride. Add stations for the scheduled time.` : "Scheduled time between these stations, from the MTA timetable."}</span>
          </span>
        </div>
        {note && (
          <>
            <i className="hr" />
            <div className="frow"><span className="txt"><b>{note.title}</b><span>{note.body}</span></span></div>
          </>
        )}
      </div>
      <footer className="sheet-foot">
        {isNew && <p className="hint">Time and stations are optional.</p>}
        <button type="button" className="btn" onClick={save}>{isNew ? "Log ride" : "Done"}</button>
        {lastToday && <button type="button" className="cancel" onClick={() => remove(lastToday.id)}>Remove last {label(l)} ride from today</button>}
        {isNew
          ? <button type="button" className="cancel" onClick={nav.pop}>Cancel</button>
          : <button type="button" className="cancel" onClick={() => remove(ride.id)}>Remove ride</button>}
      </footer>
    </div>
  );
}
