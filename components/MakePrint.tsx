"use client";
import { useMemo, useState } from "react";
import { PAPERS, SIZES, STORY_SIZE, posterSvg, savePoster, storySvg, type Paper } from "@/lib/poster";
import { dayLong, keyOf, dateOf } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";
import { Back } from "./RideSheet";

// A day's print, or with `year` the year's print: every line ridden that year, once each.
export default function MakePrint({ day, year, rides, nav, toast }: { day: string; year?: number; rides: Ride[]; nav: Nav; toast: (m: string) => void }) {
  const list = useMemo(() => year
    ? rides.filter(r => r.day.startsWith(String(year))).sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
    : ridesOn(rides, day), [rides, day, year]);
  const [size, setSize] = useState<[number, number]>(year ? [18, 24] : [8, 10]);
  const [paper, setPaper] = useState<Paper>("white");
  const [caption, setCaption] = useState(true);
  const seed = year ? String(year) : day;
  const svg = useMemo(() => posterSvg({ day: seed, lines: list.map(r => r.line), rides: list.length, size, paper, caption, title: year ? String(year) : undefined, flat: !!year }), [seed, list, size, paper, caption, year]);
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
        <div className="preview" style={{ aspectRatio: `${size[0]} / ${size[1]}` }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="opts">
          <div className="opt"><span>Size</span>
            <div>{SIZES.map(s => <button key={s.join()} type="button" aria-pressed={s[0] === size[0]} onClick={() => setSize(s)}>{s[0]} × {s[1]}</button>)}</div></div>
          <div className="opt"><span>Paper</span>
            <div>{(Object.keys(PAPERS) as Paper[]).map(p => <button key={p} type="button" aria-pressed={p === paper} onClick={() => setPaper(p)}>{p === "white" ? "White" : "Warm"}</button>)}</div></div>
          <div className="opt"><span>Caption</span>
            <div><button type="button" aria-pressed={caption} onClick={() => setCaption(true)}>{year ? "Year and lines" : "Date and lines"}</button><button type="button" aria-pressed={!caption} onClick={() => setCaption(false)}>Lines only</button></div></div>
        </div>
      </div>
      <footer className="sheet-foot">
        <p className="hint">Save it to your photos, then print it at home or at any print shop. {size[0]} × {size[1]} in.</p>
        <button type="button" className="btn" onClick={() => savePoster(svg, size, `${stem}-${size[0]}x${size[1]}.png`, toast)}>Save poster</button>
        {!year && <button type="button" className="btn-line" onClick={() => savePoster(storySvg({ day, lines: list.map(r => r.line), rides: list.length, minutes: minutes(list) }), STORY_SIZE, `${stem}-story.png`, toast)}>Save for Stories</button>}
      </footer>
    </div>
  );
}
