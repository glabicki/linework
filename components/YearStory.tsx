"use client";
import { useEffect, useMemo, useState } from "react";
import { COLOR, ORDER, label, pageColor, paperInk, textOn, type Line } from "@/lib/lines";
import { handPath, markBox } from "@/lib/art";
import { DOW, MON, MONL, dateOf, monthDay, plural } from "@/lib/dates";
import { posterSvg, savePoster } from "@/lib/poster";
import { yearStory } from "@/lib/recaps";
import type { Ride } from "@/lib/rides";
import { DayCard, DayPrint, InkDots, LineMark } from "./art";
import { YearGrid } from "./YearSoFar";
import type { Nav } from "./App";

const INK = "#2a2724", NIGHT = "#0d0d0d", WHITE = "#ffffff";
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one"];
const and = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const aDay = (m: number) => (m < 60 ? plural(Math.max(1, Math.round(m)), "minute") : `${Math.floor(m / 60)} h ${Math.round(m % 60)} min`);
const shortDay = (k: string) => { const d = dateOf(k); return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };

type Page = { key: string; bg: string; fg: string; cls?: string; body: React.ReactNode };

// 2026, Drawn. (Figma section 05): tap the right side for the next page, the left to go back.
export default function YearStory({ rides, today, year: y, nav, toast }: { rides: Ride[]; today: string; year: number; nav: Nav; toast: (m: string) => void }) {
  const s = useMemo(() => yearStory(rides, y), [rides, y]);
  const total = s.rides.length;
  const done = `${y}-12-31` < today;
  const end = done ? `${y}-12-31` : today;
  const first = s.rides.reduce((a, r) => (r.day < a ? r.day : a), end);
  const span = Math.round((dateOf(end).getTime() - dateOf(first).getTime()) / 864e5) + 1;
  const wholeYear = first.slice(5) <= "01-07";
  // The year's rides in order, so the year print layers the way the year went.
  const legs = useMemo(() => [...s.rides].sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at), [s.rides]);
  const lines = useMemo(() => [...new Set(legs.map(r => r.line))], [legs]);
  const [top, topN] = s.lines[0] ?? ["A", 0];
  const hours = Math.round(s.min / 60);
  const poster = useMemo(() => posterSvg({ day: String(y), legs, rides: total, size: [18, 24], paper: "white", caption: true, title: String(y), flat: true }), [y, legs, total]);

  const pages: Page[] = [{
    key: "year", bg: WHITE, fg: INK, cls: "st-white", body: <>
      <i className="st-rule" />
      <h1 className="st-big">{y},<br />Drawn.</h1>
      <div className="st-sheet">
        <div className="st-sheet-head"><span><b>{MON[dateOf(end).getMonth()]}</b><small>{plural(total, "ride")}</small></span><InkDots lines={lines} /></div>
        <YearGrid rides={rides} y={y} today={today} paper height={360} />
      </div>
      <p className="st-note">{!total ? "No rides this year." : wholeYear ? "Every day of the year, on one sheet." : `Every day since ${monthDay(first)}, on one sheet.`}</p>
    </>,
  }];

  if (total) {
    const fg = textOn(top), bg = pageColor(top);
    const H = Math.floor(s.min / 60), days = Math.floor(H / 24), rest = H % 24;
    const second = s.lines[1];
    const b = markBox(top, 1.06);
    const have = new Set(s.lines.map(([l]) => l));
    const left = ORDER.filter(l => !have.has(l));
    // The biggest day takes a color of its own: its most-ridden line that isn't the year's top color.
    const dayRides = s.rides.filter(r => r.day === s.busiest.day);
    const dayCount = new Map<Line, number>();
    dayRides.forEach(r => dayCount.set(r.line, (dayCount.get(r.line) ?? 0) + 1));
    const dayLine = [...[...dayCount].sort((a, c) => c[1] - a[1]).map(([l]) => l), ...s.lines.map(([l]) => l)].find(l => COLOR[l] !== COLOR[top]) ?? "7";
    const inks = new Set(lines.map(paperInk)).size;

    pages.push(
      {
        key: "days", bg: NIGHT, fg: WHITE, body: <>
          <p className="st-kick">Every day</p>
          <h2 className="st-h">{plural(s.prints, "print")}</h2>
          <YearGrid rides={rides} y={y} today={today} height={440} />
          <p className="st-note">
            {wholeYear ? "One for every day you rode, January to December." : `One for every day you rode since ${MONL[dateOf(first).getMonth()]} ${dateOf(first).getDate()}.`}
            {s.prints < span ? " The blanks are days off the train." : ""}
          </p>
        </>,
      },
      {
        key: "hours", bg, fg, body: <>
          <p className="st-kick">Underground</p>
          <div className="st-end">
            <p className="st-num">{s.min < 60 ? s.min : hours}</p>
            <p className="st-h">{s.min < 60 ? "minutes" : hours === 1 ? "hour" : "hours"}</p>
            <p className="st-note">About {aDay(s.min / span)} a day.{H >= 24 ? ` That’s ${plural(days, "day")}${rest ? ` and ${plural(rest, "hour")}` : ""} on the train.` : ""}</p>
          </div>
        </>,
      },
      {
        key: "line", bg, fg, body: <>
          <p className="st-kick">Your line</p>
          <svg className="st-route" viewBox={`${b.x.toFixed(0)} ${b.y.toFixed(0)} ${b.s.toFixed(0)} ${b.s.toFixed(0)}`} aria-hidden="true">
            <path d={handPath(top, top + "dot")} pathLength={1} fill="none" stroke={fg} strokeWidth={(b.s * 0.043).toFixed(0)} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="st-end">
            <h2 className="st-h">The {label(top)}.</h2>
            <p className="st-note">
              {plural(topN, "ride")}. {!second ? "Every ride you took." : second[1] === topN ? `Tied with the ${label(second[0])}.` : topN >= second[1] * 1.5 ? "More than any other line, by a lot." : "More than any other line."}
            </p>
          </div>
        </>,
      },
      {
        key: "top", bg: COLOR[top], fg, cls: "st-bleed", body: (
          <div className="st-bands" role="img" aria-label={`Your top lines: ${s.lines.slice(0, 5).map(([l, n]) => `${label(l)}, ${plural(n, "ride")}`).join("; ")}`}>
            {s.lines.slice(0, 5).map(([l, n]) => (
              <div key={l} style={{ background: COLOR[l], color: textOn(l), flexGrow: n }}>
                <b className={label(l).length > 2 ? "long" : undefined}>{label(l)}</b><span>{plural(n, "ride")}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        key: "lines", bg: "#000000", fg: WHITE, body: <>
          <p className="st-kick">Lines collected</p>
          <h2 className="st-h">{have.size} of {ORDER.length}</h2>
          <div className="st-lines" role="img" aria-label={`Ridden this year: ${and(s.lines.map(([l]) => label(l)))}`}>
            {ORDER.map(l => <span key={l} className={`cell${have.has(l) ? " lit" : ""}`}><span className="mark"><LineMark line={l} lit={have.has(l)} /></span><span className="lab">{label(l)}</span></span>)}
          </div>
          <p className="st-note">
            {!left.length ? "Every line in the system." : left.length <= 5 ? `Still to ride: ${and(left.map(label))}.` : `Still to ride: ${left.slice(0, 5).map(label).join(", ")} and ${WORDS[left.length - 5] ?? left.length - 5} ${left.length - 5 === 1 ? "other" : "others"}.`}
          </p>
        </>,
      },
    );
    if (s.busiest.n > 1) pages.push({
      key: "day", bg: pageColor(dayLine), fg: textOn(dayLine), body: <>
        <p className="st-kick">Your biggest day</p>
        <h2 className="st-h st-date">{shortDay(s.busiest.day)}</h2>
        <p className="st-note">{plural(s.busiest.n, "ride")} on {plural(dayCount.size, "line")}.</p>
        <div className="st-card"><DayCard day={s.busiest.day} rides={dayRides} /></div>
      </>,
    });
    pages.push(
      {
        key: "edition", bg: NIGHT, fg: WHITE, body: (
          <div className="st-edition">
            <i className="ed-rule" />
            <h2>{y},<br />Drawn.</h2>
            <div className="ed-art"><DayPrint day={String(y)} legs={legs} flat /></div>
            <div className="ed-stats">
              <span><b>{s.min < 60 ? `${s.min} min` : `${hours} h`}</b>underground</span>
              <span><b>{total}</b>{total === 1 ? "ride" : "rides"}</span>
              <span><b>{lines.length}</b>{lines.length === 1 ? "line" : "lines"}</span>
              <span><b>The {label(top)}</b>top line</span>
            </div>
            <div className="ed-colophon"><InkDots lines={lines} /><span>{plural(inks, "ink")} · printed {done ? `Jan 1, ${y + 1}` : `${monthDay(today)}, ${y}`}</span></div>
          </div>
        ),
      },
      {
        key: "print", bg: NIGHT, fg: WHITE, body: <>
          <p className="st-kick st-soft">Your {y} print</p>
          <div className="st-feed"><i className="slot" /><div className="paper" dangerouslySetInnerHTML={{ __html: poster }} /></div>
          <div className="st-acts">
            <button type="button" className="fill" onClick={e => { e.stopPropagation(); savePoster(poster, [18, 24], `linework-${y}-18x24.png`, toast); }}>Save poster</button>
            <button type="button" onClick={e => { e.stopPropagation(); nav.push({ kind: "make", day: `${y}-12-31`, year: y }); }}>Size and paper</button>
          </div>
          <p className="st-fine">18 × 24 in, white paper. Save it, then print it yourself at home or at any print shop.</p>
        </>,
      },
    );
  }

  const [i, setI] = useState(0);
  const last = pages.length - 1;
  const go = (n: number) => setI(v => Math.max(0, Math.min(last, v + n)));
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") nav.pop();
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });
  const p = pages[Math.min(i, last)];

  return (
    <div className={`story ${p.cls ?? ""}`} style={{ background: p.bg, color: p.fg }}
      onClick={e => go(e.clientX - e.currentTarget.getBoundingClientRect().left < e.currentTarget.clientWidth / 3 ? -1 : 1)}>
      <div className="st-top" aria-hidden="true"><div className="st-bar">{pages.map((q, n) => <i key={q.key} className={n <= i ? "on" : ""} />)}</div></div>
      <button type="button" className="st-x" onClick={e => { e.stopPropagation(); nav.pop(); }} aria-label="Close">×</button>
      <section key={p.key} className="st-page" aria-live="polite" aria-label={`Page ${i + 1} of ${pages.length}`}>{p.body}</section>
      <span className="sr-only">
        {i > 0 && <button type="button" onClick={e => { e.stopPropagation(); go(-1); }}>Previous page</button>}
        {i < last && <button type="button" onClick={e => { e.stopPropagation(); go(1); }}>Next page</button>}
      </span>
    </div>
  );
}
