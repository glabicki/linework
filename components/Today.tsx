"use client";
import { useEffect, useRef, useState } from "react";
import { DayCard, LineMark } from "./art";
import { ORDER, label, lineName, scheduledMin, stationName, type Line } from "@/lib/lines";
import { usualRide, type Stretch } from "@/lib/usual";
import { DOWL, MONL, dateOf, plural, to12 } from "@/lib/dates";
import { minutes, ridesOn, useStore, type Ride } from "@/lib/rides";
import { captionFor } from "@/lib/notes";
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

// No connection right now. Logging works anyway: rides save on the phone (Figma 175:4363).
function useOffline() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const set = () => setV(!navigator.onLine);
    set();
    addEventListener("online", set); addEventListener("offline", set);
    return () => { removeEventListener("online", set); removeEventListener("offline", set); };
  }, []);
  return v;
}

// Counts up to a new total instead of jumping, so a logged ride lands with a little weight.
function useCountUp(to: number) {
  const [v, setV] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    const start = from.current;
    from.current = to;
    if (start === to || matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); return; }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(start + (to - start) * e));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}

// Figma 74:953 Today · Poster, 89:1403 First day
export default function Today({ rides, day, mine, nav, onLog, recap }: { rides: Ride[]; day: string; mine: Line[]; nav: Nav; onLog: (l: Line, s?: Stretch) => void; recap?: React.ReactNode }) {
  const list = ridesOn(rides, day);
  const { notes } = useStore();
  const d = dateOf(day);
  const counts: Record<string, number> = {};
  list.forEach(r => (counts[r.line] = (counts[r.line] ?? 0) + 1));
  const min = minutes(list);
  const shown = useCountUp(min);
  const order = [...mine, ...ORDER.filter(l => !mine.includes(l))];
  const inBrowser = useInBrowser();
  const offline = useOffline();
  const now = new Date();
  const usual = usualRide(rides, day, now.getHours() * 60 + now.getMinutes());

  // Tap logs a ride; press and hold opens the ride with time and stations.
  const [plotted, setPlotted] = useState<{ line?: Line; n: number }>({ n: 0 });
  const press = useRef<{ t?: ReturnType<typeof setTimeout>; held?: boolean }>({});
  const down = (l: Line) => {
    press.current.held = false;
    press.current.t = setTimeout(() => { press.current.held = true; navigator.vibrate?.(10); nav.push({ kind: "ride", day, line: l }); }, 450);
  };
  const up = () => clearTimeout(press.current.t);
  const tap = (l: Line) => {
    if (press.current.held) { press.current.held = false; return; }
    navigator.vibrate?.(8);
    // The pen redraws the line's mark, the same stroke that lands in the print above.
    setPlotted(p => ({ line: l, n: p.n + 1 }));
    onLog(l);
  };

  return (
    <div className="today">
      <header className="poster-head">
        <div>
          <h1 className="t-page">{DOWL[d.getDay()]}</h1>
          <p className="t-date">{MONL[d.getMonth()]} {d.getDate()}</p>
        </div>
      </header>

      {offline ? (
        <div className="a2hs-note" role="status">
          <p>No signal. {list.length ? `${plural(list.length, "ride")} saved on this phone.` : "Rides you log still save on this phone."}</p>
        </div>
      ) : inBrowser && (
        <div className="a2hs-note">
          <button type="button" onClick={() => nav.push({ kind: "home" })}>Safari can clear your rides if you don’t visit for a week. <b>Add to Home Screen</b></button>
        </div>
      )}

      <div className="plate">
        <DayCard day={day} rides={list} note={captionFor(day, rides, notes)} onClick={() => nav.push({ kind: "day", day })} />
      </div>

      <div className="minutes" aria-live="polite">
        <span className="t-minutes" aria-label={`${min}`}>{shown}</span>
        <span className="t-stat-label">minutes<br />underground</span>
      </div>

      {/* Recaps wait under the print, never over it. */}
      {recap}

      <section className="picker" aria-label="Log a ride">
        <div className="picker-head">
          <h2 className="t-row">Tap a line you rode</h2>
          <span className="count">{plural(list.length, "ride")}</span>
        </div>
        {usual && (
          <button type="button" className="usual" onClick={() => { navigator.vibrate?.(8); onLog(usual.line, usual); }}
            aria-label={`Log your usual ride: ${lineName(usual.line)}, ${stationName(usual.from)} to ${stationName(usual.to)}`}>
            <LineMark line={usual.line} lit size={34} />
            <span className="txt">
              <b>{label(usual.line)}{"\u2002"}{stationName(usual.from)} → {stationName(usual.to)}</b>
              <span>Your usual around now · {scheduledMin(usual.line, usual.from, usual.to)} min</span>
            </span>
            <span className="go">Log</span>
          </button>
        )}
        <div className="grid">
          {order.map(l => {
            const n = counts[l] ?? 0;
            return (
              <button key={l} type="button" className={`cell${n ? " lit" : ""}`}
                onPointerDown={() => down(l)} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
                onContextMenu={e => e.preventDefault()} onClick={() => tap(l)}
                aria-label={`Log a ride on ${lineName(l)}${n ? `, ridden ${n === 1 ? "once" : n + " times"} today` : ""}`}>
                <span key={plotted.line === l ? plotted.n : 0} className={`mark${plotted.line === l ? " plot" : ""}`}><LineMark line={l} lit={!!n} />{n > 1 && <b className="x">{n}</b>}</span>
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
