"use client";
import { useEffect, useRef, useState } from "react";
import { handPath, markBox } from "@/lib/art";
import { COLOR, ORDER } from "@/lib/lines";

// Figma 83:1333 → 83:1362 → 83:1391 → 75:1332: the headline rises, every route draws,
// the poster holds, then it's pulled up into the machine and Today is underneath.
// About 6 s: the headline, then the routes plotted one after another, then a beat on the finished poster.
const HOLD = 6200, LIFT = 700;
const HEAD = [["Every Ride/", 0.4], ["Uptown &", 0.6], ["Downtown/", 0.8], ["Local &", 1.35], ["Express/", 1.55], ["Drawn.", 1.75]] as const;

export default function Intro({ onDone }: { onDone: () => void }) {
  const [lift, setLift] = useState(false);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    if (!lift) { const t = setTimeout(() => setLift(true), HOLD); return () => clearTimeout(t); }
    const t = setTimeout(() => done.current(), LIFT);
    return () => clearTimeout(t);
  }, [lift]);

  return (
    <div className={`intro${lift ? " lift" : ""}`} onClick={() => setLift(true)} role="dialog" aria-label="Linework. Every ride, uptown and downtown, local and express, drawn.">
      <i className="in-rule" style={{ animationDelay: "0s" }} />
      <p className="in-line in-name"><span style={{ animationDelay: ".1s" }}>Linework</span></p>
      <i className="in-rule" style={{ animationDelay: ".2s" }} />
      <div className="in-head" aria-hidden="true">
        {HEAD.map(([t, d]) => <p key={t} className="in-line"><span style={{ animationDelay: `${d}s` }}>{t}</span></p>)}
      </div>
      <div className="in-routes" aria-hidden="true">
        {ORDER.map((l, i) => {
          const b = markBox(l, 1.24);
          return (
            <svg key={l} viewBox={`${b.x.toFixed(0)} ${b.y.toFixed(0)} ${b.s.toFixed(0)} ${b.s.toFixed(0)}`}>
              <path d={handPath(l, l + "dot")} pathLength={1} fill="none" stroke={COLOR[l]} strokeWidth={(b.s * 0.1).toFixed(0)} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${(2 + i * 0.12).toFixed(2)}s` }} />
            </svg>
          );
        })}
      </div>
      <i className="in-rule" style={{ animationDelay: "2s" }} />
      <button type="button" className="in-skip" onClick={e => { e.stopPropagation(); setLift(true); }}>Tap to skip</button>
    </div>
  );
}
