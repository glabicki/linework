"use client";
import { useEffect, useState } from "react";
import { COLOR, label } from "@/lib/lines";
import { DOWL, MON, MONL, dateOf, plural } from "@/lib/dates";
import { yearStory } from "@/lib/recaps";
import type { Ride } from "@/lib/rides";
import { DayCard, LineMark } from "./art";
import type { Nav } from "./App";

const longDay = (k: string) => { const d = dateOf(k); return `${DOWL[d.getDay()]}, ${MONL[d.getMonth()]} ${d.getDate()}`; };
const shortDay = (k: string) => { const d = dateOf(k); return `${MON[d.getMonth()]} ${d.getDate()}`; };

// 2026, Drawn. as a story: tap the right side for the next page, the left to go back.
export default function YearStory({ rides, today, year, nav }: { rides: Ride[]; today: string; year: number; nav: Nav }) {
  const s = yearStory(rides, year);
  const done = `${year}-12-31` < today;
  const hours = Math.round(s.min / 60);
  const total = s.rides.length;
  const [top, topN] = s.lines[0] ?? [];

  const pages: { key: string; body: React.ReactNode }[] = [
    { key: "intro", body: <><h1 className="st-title">{year},<br />{done ? "Drawn." : "so far."}</h1><p className="st-note">{done ? "Your year on the subway." : "Your year on the subway, still drawing. The full story opens January 1."}</p></> },
  ];
  if (total) {
    pages.push({ key: "hours", body: <><p className="st-num">{s.min < 60 ? s.min : hours}</p><p className="st-unit">{s.min < 60 ? "minutes" : hours === 1 ? "hour" : "hours"} underground</p><p className="st-note">{hours >= 24 ? `About ${plural(Math.round(hours / 24), "full day")} on the train.` : `Across ${plural(total, "ride")}.`}</p></> });
    if (top) pages.push({ key: "top", body: <><div className="st-mark"><LineMark line={top} lit size={190} /></div><h2 className="st-head">Your line was the {label(top)}.</h2><p className="st-note">{topN === total ? `Every one of your ${plural(total, "ride")}.` : `${topN} of your ${total} rides.`}</p></> });
    if (s.lines.length > 1) pages.push({
      key: "lines", body: <>
        <div className="bands st-bands" aria-hidden="true">{s.lines.slice(0, 8).map(([l, n]) => <i key={l} style={{ background: COLOR[l], flexGrow: n }} />)}</div>
        <div className="band-keys" aria-hidden="true">{s.lines.slice(0, 8).map(([l, n]) => <span key={l} style={{ flexGrow: n }}>{n / total >= 0.07 ? label(l) : ""}</span>)}</div>
        <h2 className="st-head">{plural(s.lines.length, "line")}.</h2>
        <p className="st-note">{s.lines.slice(0, 3).map(([l]) => label(l)).join(", ").replace(/, ([^,]*)$/, " and $1")} most of all.</p>
      </>,
    });
    if (s.busiest.n > 1) pages.push({ key: "busiest", body: <><div className="st-card"><DayCard day={s.busiest.day} rides={s.rides.filter(r => r.day === s.busiest.day)} size="plain" /></div><h2 className="st-head">Your busiest day: {longDay(s.busiest.day)}.</h2><p className="st-note">{plural(s.busiest.n, "ride")}.</p></> });
    if (s.streak.n > 1) pages.push({ key: "streak", body: <><p className="st-num">{s.streak.n}</p><p className="st-unit">days in a row</p><p className="st-note">Your longest run, {shortDay(s.streak.start)} – {shortDay(s.streak.end)}.</p></> });
  }
  pages.push({
    key: "end", body: <>
      <h2 className="st-title">{plural(s.prints, "print")}.</h2>
      <p className="st-note">{s.prints ? (done ? "Every day you rode, drawn from the real routes." : "Every ride from here adds one.") : "Log a ride on Today and your year starts drawing."}</p>
      <div className="st-acts">
        {s.prints > 0 && <button type="button" className="btn" onClick={e => { e.stopPropagation(); nav.replace({ kind: "year", year }); }}>See every print</button>}
        <button type="button" className="btn-line" onClick={e => { e.stopPropagation(); nav.pop(); }}>Done</button>
      </div>
    </>,
  });

  const [i, setI] = useState(0);
  const last = pages.length - 1;
  const go = (n: number) => setI(v => Math.max(0, Math.min(last, v + n)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") nav.pop();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  return (
    <div className="story" onClick={e => go(e.clientX < e.currentTarget.getBoundingClientRect().width / 3 ? -1 : 1)}>
      <div className="st-bar" aria-hidden="true">{pages.map((p, n) => <i key={p.key} className={n <= i ? "on" : ""} />)}</div>
      <button type="button" className="year-close" onClick={e => { e.stopPropagation(); nav.pop(); }} aria-label="Close">×</button>
      <section key={pages[i].key} className="st-page" aria-live="polite">{pages[i].body}</section>
      {i < last && <p className="st-hint" aria-hidden="true">Tap for more</p>}
      <span className="sr-only"><button type="button" onClick={e => { e.stopPropagation(); go(1); }}>Next page</button></span>
    </div>
  );
}
