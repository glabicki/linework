"use client";
import { useEffect, useRef, useState } from "react";
import { DayCard, LineMark } from "./art";
import { ORDER, label, lineName, stationName, type Line } from "@/lib/lines";
import { DOWL, MONL, dateOf, plural, to12 } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";

// Not opened from the Home Screen, on a phone-sized screen (Figma 178:4413).
function useInBrowser() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const framed = window.self !== window.top; // the desktop phone frame has its own note
    setV(!standalone && !framed && innerWidth <= 500);
  }, []);
  return v;
}

// Figma 74:953 Today · Poster, 89:1403 First day
export default function Today({ rides, day, mine, nav, onLog, recap }: { rides: Ride[]; day: string; mine: Line[]; nav: Nav; onLog: (l: Line) => void; recap?: React.ReactNode }) {
  const list = ridesOn(rides, day);
  const d = dateOf(day);
  const counts: Record<string, number> = {};
  list.forEach(r => (counts[r.line] = (counts[r.line] ?? 0) + 1));
  const min = minutes(list);
  const order = [...mine, ...ORDER.filter(l => !mine.includes(l))];
  const inBrowser = useInBrowser();

  // Tap logs a ride; press and hold opens the ride with time and stations.
  const press = useRef<{ t?: ReturnType<typeof setTimeout>; held?: boolean }>({});
  const down = (l: Line) => {
    press.current.held = false;
    press.current.t = setTimeout(() => { press.current.held = true; navigator.vibrate?.(10); nav.push({ kind: "ride", day, line: l }); }, 450);
  };
  const up = () => clearTimeout(press.current.t);
  const tap = (l: Line) => { if (press.current.held) { press.current.held = false; return; } onLog(l); };

  return (
    <div className="today">
      <header className="poster-head">
        <div>
          <h1 className="t-page">{DOWL[d.getDay()]}</h1>
          <p className="t-date">{MONL[d.getMonth()]} {d.getDate()}</p>
        </div>
        <button type="button" className="me" onClick={() => nav.push({ kind: "account" })} aria-label="Account"><span>LW</span></button>
      </header>

      {recap}

      {inBrowser && (
        <div className="a2hs-note">
          <button type="button" onClick={() => nav.push({ kind: "home" })}>Safari can clear your rides if you don’t visit for a week. <b>Add to Home Screen</b></button>
        </div>
      )}

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
          <span className="count">{plural(list.length, "ride")}</span>
        </div>
        <div className="grid">
          {order.map(l => {
            const n = counts[l] ?? 0;
            return (
              <button key={l} type="button" className={`cell${n ? " lit" : ""}`}
                onPointerDown={() => down(l)} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
                onContextMenu={e => e.preventDefault()} onClick={() => tap(l)}
                aria-label={`Log a ride on ${lineName(l)}${n ? `, ridden ${n === 1 ? "once" : n + " times"} today` : ""}`}>
                <span className="mark"><LineMark line={l} lit={!!n} />{n > 1 && <b className="x">{n}</b>}</span>
                <span className="lab">{label(l)}</span>
              </button>
            );
          })}
        </div>
        <div className="fine-wrap"><p className="fine">
          {list.length
            ? list.map(r => (
                <button key={r.id} type="button" className="fine-ride" onClick={() => nav.push({ kind: "ride", day, rideId: r.id })}>
                  {r.time && <b>{to12(r.time)} </b>}
                  {r.time ? label(r.line) : <b>{label(r.line)}</b>}{r.from && r.to ? `, ${stationName(r.from)} to ${stationName(r.to)}.` : `, ${r.est ? "about " : ""}${r.min} min.`}
                </button>
              ))
            : !rides.length && mine.length
              ? <b>Nothing printed yet. Tap the line you rode and the plotter draws it. Your lines from setup come first.</b>
              : "Nothing yet. Tap a line you rode and the plotter draws it. Press and hold to add a time or stations."}
        </p></div>
      </section>
    </div>
  );
}
