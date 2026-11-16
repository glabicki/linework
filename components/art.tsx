"use client";
import { memo } from "react";
import { frameFor, markBox, handPath, strokesFor, strokeWidth, hash } from "@/lib/art";
import { COLOR, label, paperInk, type Line } from "@/lib/lines";
import { dayShort, plural } from "@/lib/dates";
import type { Ride } from "@/lib/rides";

// The drawing for one day: routes in paper inks on white. No chrome, no mark.
// `flat` is the year print (Figma "every line once, same weight"): inks at 90% instead of multiplied,
// so a dozen lines sharing track don't pile up into black.
export const DayPrint = memo(function DayPrint({ day, lines, base = 300, fresh, flat }: { day: string; lines: Line[]; base?: number; fresh?: Line; flat?: boolean }) {
  const f = frameFor(lines);
  const sw = strokeWidth(f.w, base);
  return (
    <svg className="print-art" viewBox={`${f.x.toFixed(0)} ${f.y.toFixed(0)} ${f.w.toFixed(0)} ${f.h.toFixed(0)}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {strokesFor(day, lines).map(s => (
        <path key={s.line} d={s.d} className={s.line === fresh ? "draw" : undefined} pathLength={s.line === fresh ? 1 : undefined} transform={`translate(${s.dx.toFixed(0)} ${s.dy.toFixed(0)})`} fill="none" stroke={s.color}
          strokeWidth={sw.toFixed(0)} strokeLinecap="round" strokeLinejoin="round" style={flat ? { opacity: 0.9 } : { mixBlendMode: "multiply" }} />
      ))}
    </svg>
  );
});

export function InkDots({ lines }: { lines: Line[] }) {
  const inks = [...new Set(lines.map(paperInk))];
  if (!inks.length) return null;
  return <span className="inks" aria-hidden="true">{inks.map(c => <i key={c} style={{ background: c }} />)}</span>;
}

// White card: the print plus its date and ride count.
export function DayCard({ day, rides, size = "large", onClick }: { day: string; rides: Ride[]; size?: "large" | "plain"; onClick?: () => void }) {
  const lines = rides.map(r => r.line);
  // A line ridden for the first time today, logged seconds ago, gets drawn in.
  const last = rides.reduce<Ride | undefined>((a, r) => (!a || r.at > a.at ? r : a), undefined);
  const fresh = last && Date.now() - last.at < 4000 && lines.filter(l => l === last.line).length === 1 ? last.line : undefined;
  const body = (
    <>
      <DayPrint day={day} lines={lines} fresh={fresh} />
      {size === "large" && (
        <span className="cap">
          <b>{dayShort(day)}</b>
          <span><InkDots lines={lines} />{rides.length ? plural(rides.length, "ride") : "No rides yet"}</span>
        </span>
      )}
    </>
  );
  const cls = `card card-${size}`;
  const aria = `${dayShort(day)}, ${rides.length ? plural(rides.length, "ride") : "no rides"}`;
  return onClick ? <button type="button" className={cls} onClick={onClick} aria-label={aria}>{body}</button> : <div className={cls} role="img" aria-label={aria}>{body}</div>;
}

// A line's route as a small mark. Muted until ridden.
// Figma Line marker: route fills 42 of a 52 box, 5px stroke.
export const LineMark = memo(function LineMark({ line, lit, size = 52 }: { line: Line; lit: boolean; size?: number }) {
  const b = markBox(line, 1.24);
  return (
    <svg width={size} height={size} viewBox={`${b.x.toFixed(0)} ${b.y.toFixed(0)} ${b.s.toFixed(0)} ${b.s.toFixed(0)}`} aria-hidden="true">
      <path d={handPath(line, line + "dot")} fill="none" stroke={lit ? COLOR[line] : "#34302C"} strokeWidth={(b.s * 0.096).toFixed(0)} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

export const lineAria = (l: Line) => label(l);
export const seedOf = hash;
