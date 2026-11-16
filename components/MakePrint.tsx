"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAPERS, SIZES, posterSvg, savePoster, type Paper } from "@/lib/poster";
import { dayLong, keyOf, dateOf } from "@/lib/dates";
import { ridesOn, useStore, type Ride } from "@/lib/rides";
import { captionFor } from "@/lib/notes";
import type { Nav } from "./App";
import { Back } from "./RideSheet";

// A day's print, or with `year` the year's print: every stretch ridden that year, each drawn once.
export default function MakePrint({ day, year, rides, nav, toast }: { day: string; year?: number; rides: Ride[]; nav: Nav; toast: (m: string) => void }) {
  const list = useMemo(() => year
    ? rides.filter(r => r.day.startsWith(String(year))).sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
    : ridesOn(rides, day), [rides, day, year]);
  const [size, setSize] = useState<[number, number]>(year ? [18, 24] : [8, 10]);
  const [paper, setPaper] = useState<Paper>("white");
  const [caption, setCaption] = useState(true);
  const seed = year ? String(year) : day;
  const { notes } = useStore();
  const note = year ? undefined : captionFor(day, rides, notes);
  const svg = useMemo(() => posterSvg({ day: seed, legs: list, rides: list.length, size, paper, caption, note, title: year ? String(year) : undefined, flat: !!year }), [seed, list, size, paper, caption, note, year]);
  const paperRef = useRef<HTMLDivElement>(null);
  // Every change re-plots the print: the sheet drops in like it's being pinned up, then the pen draws each line.
  useEffect(() => {
    const el = paperRef.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([
      { transform: "translateY(-14px) rotate(-3deg)" },
      { transform: "translateY(3px) rotate(1.2deg)", offset: 0.55 },
      { transform: "translateY(-1px) rotate(-0.4deg)", offset: 0.8 },
      { transform: "none" },
    ], { duration: 700, easing: "ease-out" });
    const paths = [...el.querySelectorAll("path")];
    const step = Math.min(140, 1400 / Math.max(1, paths.length));
    paths.forEach((p, i) => {
      p.setAttribute("pathLength", "1");
      p.style.strokeDasharray = "1 1";
      p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 800, delay: 260 + i * step, easing: "cubic-bezier(.55,0,.25,1)", fill: "backwards" });
    });
  }, [svg]);
  const stem = year ? `linework-${year}` : `linework-${keyOf(dateOf(day))}`;

  // Figma 159:3169 Prints · Make a print
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="page-copy">
        <h1 className="t-large">Make a print</h1>
        <p>{year ? `${year}, every line you rode` : dayLong(day)}, sized to frame. Pick a size and paper, then save it.</p>
      </div>
      <div className="page-body">
        <div ref={paperRef} className="preview" style={{ aspectRatio: `${size[0]} / ${size[1]}` }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="opts">
          <div className="opt"><span>Size</span>
            <div>{SIZES.map(s => <button key={s.join()} type="button" aria-pressed={s[0] === size[0]} onClick={() => setSize(s)}>{s[0]}{"\u2009×\u2009"}{s[1]}</button>)}</div></div>
          <div className="opt"><span>Paper</span>
            <div>{(Object.keys(PAPERS) as Paper[]).map(p => <button key={p} type="button" aria-pressed={p === paper} onClick={() => setPaper(p)}>{p === "white" ? "White" : "Warm"}</button>)}</div></div>
          <div className="opt"><span>Caption</span>
            <div><button type="button" aria-pressed={caption} onClick={() => setCaption(true)}>{year ? "Year and lines" : note ? "Date and caption" : "Date and lines"}</button><button type="button" aria-pressed={!caption} onClick={() => setCaption(false)}>Lines only</button></div></div>
        </div>
      </div>
      <footer className="sheet-foot">
        <p className="hint">Save it to your photos, then print it at home or at any print shop. {size[0]} × {size[1]} in.</p>
        <button type="button" className="btn" onClick={() => savePoster(svg, size, `${stem}-${size[0]}x${size[1]}.png`, toast)}>Save poster</button>
      </footer>
    </div>
  );
}
