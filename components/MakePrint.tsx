"use client";
import { useMemo, useState } from "react";
import { PAPERS, SIZES, STORY_SIZE, posterPng, posterSvg, storySvg, type Paper } from "@/lib/poster";
import { dayLong, keyOf, dateOf } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";
import { Back } from "./RideSheet";

export default function MakePrint({ day, rides, nav, toast }: { day: string; rides: Ride[]; nav: Nav; toast: (m: string) => void }) {
  const list = ridesOn(rides, day);
  const [size, setSize] = useState<[number, number]>([8, 10]);
  const [paper, setPaper] = useState<Paper>("white");
  const [caption, setCaption] = useState(true);
  const svg = useMemo(() => posterSvg({ day, lines: list.map(r => r.line), rides: list.length, size, paper, caption }), [day, list, size, paper, caption]);
  const name = `linework-${keyOf(dateOf(day))}-${size[0]}x${size[1]}.png`;

  const save = async (svg: string, size: [number, number], name: string) => {
    try {
      const blob = await posterPng(svg, size);
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast("Saved");
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast("Couldn’t save. Try again.");
    }
  };

  // Figma 159:3169 Prints · Make a print
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="page-copy">
        <h1 className="t-large">Make a print</h1>
        <p>{dayLong(day)}, sized to frame. Pick a size and paper, then save it.</p>
      </div>
      <div className="page-body">
        <div className="preview" style={{ aspectRatio: `${size[0]} / ${size[1]}` }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="opts">
          <div className="opt"><span>Size</span>
            <div>{SIZES.map(s => <button key={s.join()} type="button" aria-pressed={s[0] === size[0]} onClick={() => setSize(s)}>{s[0]} × {s[1]}</button>)}</div></div>
          <div className="opt"><span>Paper</span>
            <div>{(Object.keys(PAPERS) as Paper[]).map(p => <button key={p} type="button" aria-pressed={p === paper} onClick={() => setPaper(p)}>{p === "white" ? "White" : "Warm"}</button>)}</div></div>
          <div className="opt"><span>Caption</span>
            <div><button type="button" aria-pressed={caption} onClick={() => setCaption(true)}>Date and lines</button><button type="button" aria-pressed={!caption} onClick={() => setCaption(false)}>Lines only</button></div></div>
        </div>
      </div>
      <footer className="sheet-foot">
        <p className="hint">Save it to your photos, then print it at home or at any print shop. {size[0]} × {size[1]} in.</p>
        <button type="button" className="btn" onClick={() => save(svg, size, name)}>Save poster</button>
        <button type="button" className="btn-line" onClick={() => save(storySvg({ day, lines: list.map(r => r.line), rides: list.length, minutes: minutes(list) }), STORY_SIZE, `linework-${keyOf(dateOf(day))}-story.png`)}>Save for Stories</button>
      </footer>
    </div>
  );
}
