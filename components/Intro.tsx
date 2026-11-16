"use client";
import { useEffect, useRef, useState } from "react";
import { handPath, markBox } from "@/lib/art";
import { COLOR, ORDER } from "@/lib/lines";

// Figma 83:1333 → 83:1362 → 83:1391 → 75:1332: the headline rises, every route draws,
// the poster holds, then it's pulled up into the machine and Today is underneath.
const HOLD = 3600, LIFT = 700;
const HEAD = [["Every Ride/", 0.35], ["Uptown &", 0.5], ["Downtown/", 0.65], ["Local &", 1.1], ["Express/", 1.25], ["Drawn.", 1.4]] as const;

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
              <path d={handPath(l, l + "dot")} pathLength={1} fill="none" stroke={COLOR[l]} strokeWidth={(b.s * 0.1).toFixed(0)} strokeLinecap="round" strokeLinejoin="round" style={{ animationDelay: `${1.2 + i * 0.045}s` }} />
            </svg>
          );
        })}
      </div>
      <i className="in-rule" style={{ animationDelay: "2.2s" }} />
      <p className="in-fine">A print of every subway ride you take in New York. Tap the line you rode and the plotter draws it, one ink pass at a time.</p>
      <button type="button" className="in-skip" onClick={e => { e.stopPropagation(); setLift(true); }}>Tap to skip</button>
    </div>
  );
}
