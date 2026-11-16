"use client";
import { useEffect, useState } from "react";
import { DayCard, LineMark } from "./art";
import { Back } from "./RideSheet";
import { Icon } from "./icons";
import { label, stationName } from "@/lib/lines";
import { DOWL, addDays, dateOf, fmtH, monthDay, plural, to12 } from "@/lib/dates";
import { minutes, removeRide, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// Figma 109:1131 Prints · Day (today) and 114:1534 Prints · Past day
export default function DayPage({ day, today, rides, nav, onRemoved }: { day: string; today: string; rides: Ride[]; nav: Nav; onRemoved: (r: Ride) => void }) {
  const list = ridesOn(rides, day);
  const m = minutes(list);
  const d = dateOf(day);
  const est = list.some(r => r.est);
  const isToday = day === today;

  // Figma 192:4442: for a few seconds after a ride is logged, the plotter is still drawing it.
  const newest = list.reduce<Ride | undefined>((a, r) => (!a || r.at > a.at ? r : a), undefined);
  const [now, setNow] = useState(() => Date.now());
  const drawing = !!newest && now - newest.at < 4000;
  useEffect(() => {
    if (!drawing || !newest) return;
    const id = setTimeout(() => setNow(Date.now()), 4000 - (Date.now() - newest.at));
    return () => clearTimeout(id);
  }, [drawing, newest]);

  // Figma 132:1947: the first time you open yesterday, it is "ready".
  const [ready] = useState(() => {
    if (day !== addDays(today, -1) || !list.length) return false;
    try { if (localStorage.getItem("linework.ready") === day) return false; localStorage.setItem("linework.ready", day); } catch { /* no storage */ }
    return true;
  });
  const summary = `${plural(list.length, "ride")} · ${est ? "about " : ""}${m < 60 ? plural(m, "minute") : fmtH(m)} underground`;
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="page-copy">
        <h1 className="t-page">{monthDay(day)}</h1>
        <p>{ready ? `Your ${DOWL[d.getDay()]} is ready. ${summary}` : `${DOWL[d.getDay()]}${isToday ? " · today" : ""} · ${list.length ? summary : "no rides yet"}`}</p>
      </div>
      <div className="page-body">
        <div className="day-card"><DayCard day={day} rides={list} /></div>
        <i className="hr" />
        {list.map(r => (
          <div key={r.id} className="ride-row">
            <button type="button" className="ride-tap" onClick={() => nav.push({ kind: "ride", day, rideId: r.id })}>
              <LineMark line={r.line} lit size={34} />
              <span className="txt">
                <b>{label(r.line)}{"\u2002"}{r.from && r.to ? `${stationName(r.from)} → ${stationName(r.to)}` : "Ride"}</b>
                <span>{[to12(r.time), `${r.est ? "about " : ""}${r.min} min`].filter(Boolean).join(" · ")}</span>
              </span>
            </button>
            <button type="button" className="x-btn" aria-label={`Remove ${label(r.line)} ride`} onClick={() => { const x = removeRide(r.id); if (x) onRemoved(x); }}><Icon name="close" size={18} /></button>
          </div>
        ))}
        {!list.length && <p className="page-note">{isToday ? "Nothing yet. Tap a line you rode and the plotter draws it." : "Nothing logged this day. Forgot? Add the lines you rode; no time needed."}</p>}
      </div>
      <footer className="sheet-foot">
        {drawing && newest && <p className="hint">Still drawing the {label(newest.line)}. It lands in a moment.</p>}
        {list.length > 0 && <button type="button" className="action" onClick={() => nav.push({ kind: "make", day })}>Make a print</button>}
        <button type="button" className={`action${isToday && !list.length ? " bare" : ""}`} onClick={() => nav.push({ kind: "add", day })}>Add a ride</button>
      </footer>
    </div>
  );
}
