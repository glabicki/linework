"use client";
import { useEffect, useRef, useState } from "react";
import { DayCard, LineMark } from "./art";
import { Back } from "./RideSheet";
import { Icon } from "./icons";
import { label, stationName } from "@/lib/lines";
import { DOWL, addDays, dateOf, fmtH, monthDay, plural, to12 } from "@/lib/dates";
import { NOTE_MAX, minutes, removeRide, ridesOn, setNote, useStore, type Ride } from "@/lib/rides";
import { captionFor } from "@/lib/notes";
import type { Nav } from "./App";

// Figma 109:1131 Prints · Day (today) and 114:1534 Prints · Past day
export default function DayPage({ day, today, rides, nav, onRemoved }: { day: string; today: string; rides: Ride[]; nav: Nav; onRemoved: (r: Ride) => void }) {
  const list = ridesOn(rides, day);
  const { notes } = useStore();
  // Once the caption field is on screen it stays for this visit, so clearing the caption doesn't pull the field away.
  const [hadNote] = useState(() => !!notes[day]);
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
        <div className="day-card"><DayCard day={day} rides={list} note={captionFor(day, rides, notes)} /></div>
        {/* A caption stays when its rides are removed; only clearing it deletes it. */}
        {(list.length > 0 || hadNote || !!notes[day]) && (
          <Caption day={day} value={notes[day] ?? ""} />
        )}
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

// The day's caption. It saves as you type; Done puts the keyboard away and "Saved" confirms it.
function Caption({ day, value }: { day: string; value: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const changed = useRef(false);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);
  return (
    <div className="day-note">
      <div className="dn-top">
        <label htmlFor="day-note">Caption</label>
        {editing
          ? <button type="button" onPointerDown={e => e.preventDefault()} onClick={() => ref.current?.blur()}>Done</button>
          : <span className="dn-saved" aria-live="polite">{saved ? "Saved" : ""}</span>}
      </div>
      <input id="day-note" ref={ref} value={value} maxLength={NOTE_MAX} placeholder="What was today?" enterKeyHint="done" autoComplete="off"
        onChange={e => { changed.current = true; setNote(day, e.target.value); }}
        onFocus={() => { setEditing(true); setSaved(false); changed.current = false; }}
        onBlur={() => { setEditing(false); if (changed.current) setSaved(true); }}
        onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
    </div>
  );
}
