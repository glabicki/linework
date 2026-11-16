"use client";
import { COLOR, label, type Line } from "@/lib/lines";
import { DOWL, MONL, addDays, dateOf, keyOf, plural } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";
import { TabHead } from "./Prints";
import { DayPrint, LineMark } from "./art";

function topLines(list: Ride[], n: number) {
  const c = new Map<Line, number>();
  list.forEach(r => c.set(r.line, (c.get(r.line) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

const hoursOf = (list: Ride[]) => Math.round(minutes(list) / 60);
const daysOf = (list: Ride[]) => new Set(list.map(r => r.day)).size;

// Three numbers side by side.
function Stats({ items }: { items: [string, number][] }) {
  return (
    <dl className="rc-stats">
      {items.map(([k, v]) => <div key={k}><dd>{v.toLocaleString()}</dd><dt>{k}</dt></div>)}
    </dl>
  );
}

// The lines ridden most, each with a bar in its own color.
function TopLines({ list, n = 3 }: { list: Ride[]; n?: number }) {
  const top = topLines(list, n);
  const max = top[0]?.[1] ?? 1;
  return (
    <ol className="rc-top">
      {top.map(([l, c]) => (
        <li key={l}>
          <LineMark line={l} lit size={28} />
          <b>{label(l)}</b>
          <span className="bar"><i style={{ width: `${(c / max) * 100}%`, background: COLOR[l] }} /></span>
          <span className="n">{plural(c, "ride")}</span>
        </li>
      ))}
    </ol>
  );
}

// Every line ridden this year as one strip, each as wide as its share of rides.
function Bands({ y, list }: { y: number; list: Ride[] }) {
  const top = topLines(list, 8);
  const topN = top.reduce((a, [, n]) => a + n, 0);
  return (
    <div className="rc-bands">
      <div className="bands" role="img" aria-label={top.length ? `Lines you rode most in ${y}: ${top.map(([l, n]) => `${label(l)}, ${plural(n, "ride")}`).join("; ")}` : "No rides yet this year"}>
        {top.length ? top.map(([l, n]) => <i key={l} style={{ background: COLOR[l], flexGrow: n }} />) : <i className="empty" />}
      </div>
      {top.length > 0 && (
        <div className="band-keys" aria-hidden="true">
          {top.map(([l, n]) => <span key={l} style={{ flexGrow: n }}>{n / topN >= 0.07 ? label(l) : ""}</span>)}
        </div>
      )}
    </div>
  );
}

// The year card: one band per line, as wide as its share of the year's rides.
function Drawn({ y, list, nav }: { y: number; list: Ride[]; nav: Nav }) {
  return (
    <section className="drawn">
      <Bands y={y} list={list} />
      <div className="drawn-row">
        <div><h2 className="t-card">{y},<br />Drawn.</h2><p>Your year in lines. Your {y} print is ready to save.</p></div>
        <button type="button" onClick={() => nav.push({ kind: "story", year: y })}>Play ›</button>
      </div>
    </section>
  );
}

export default function Recaps({ rides, today, nav }: { rides: Ride[]; today: string; nav: Nav }) {
  const t = dateOf(today);
  const y = t.getFullYear();
  const year = rides.filter(r => r.day.startsWith(String(y)));
  // Through January, last year's story leads the page and the new year starts as a fresh sheet.
  const lastYear = rides.filter(r => r.day.startsWith(String(y - 1)));
  const replay = t.getMonth() === 0 && lastYear.length > 0;
  const dayN = t.getDate();
  const sheet = Math.max(14, Math.ceil(dayN / 7) * 7);

  // Last full month
  const lm = new Date(t.getFullYear(), t.getMonth() - 1, 1);
  const prev = new Date(t.getFullYear(), t.getMonth() - 2, 1);
  const inMonth = (d: Date) => { const p = keyOf(d).slice(0, 7); return rides.filter(r => r.day.startsWith(p)); };
  const last = inMonth(lm), before = inMonth(prev);
  const days = new Date(lm.getFullYear(), lm.getMonth() + 1, 0).getDate();
  const perDay = [...Array(days)].map((_, i) => ridesOn(last, keyOf(new Date(lm.getFullYear(), lm.getMonth(), i + 1))).length);
  const maxDay = Math.max(1, ...perDay);
  const h = Math.round(minutes(last) / 60), hb = Math.round(minutes(before) / 60);
  const perDayH = minutes(last) / 60 / days;

  const busiest = perDay.indexOf(maxDay);

  // Figma 115:1758 Recaps · with 2026, Drawn., 175:3844 Recaps · New user and 175:3986 Recaps · Jan 2 (replay ready)
  return (
    <div className="tab">
      <TabHead title="Recaps" />
      <div className="recaps-body">
        {replay && <Drawn y={y - 1} list={lastYear} nav={nav} />}
        {replay && (
          <section className="new-sheet">
            <p className="kicker">{y}</p>
            <div className="ns-grid" role="img" aria-label={`${plural(new Set(year.map(r => r.day)).size, "day")} with rides so far in ${y}`}>
              {[...Array(sheet)].map((_, i) => {
                const k = addDays(`${y}-01-01`, i), list = ridesOn(year, k);
                if (k > today) return <span key={k} />;
                return list.length ? <span key={k} className="on"><DayPrint day={k} legs={list} base={300} /></span> : <span key={k} className="past" />;
              })}
            </div>
            <p>Day {dayN}. A new sheet. Your {y} replay opens next January.</p>
          </section>
        )}
        {last.length ? (
          <section className="rc-sec">
            <h2 className="sec-h">{MONL[lm.getMonth()]}</h2>
            <div className="total"><span className="t-hero">{h}</span><span>{h === 1 ? "hour" : "hours"} underground</span></div>
            <p className="note">
              About {perDayH >= 1 ? `${Math.round(perDayH)} h` : `${Math.round(perDayH * 60)} min`} a day
              {!before.length ? "." : h === hb ? `, about the same as ${MONL[prev.getMonth()]}.` : `, and ${Math.abs(h - hb)} h ${h > hb ? "more" : "less"} than ${MONL[prev.getMonth()]}.`}
            </p>
            <Stats items={[["Rides", last.length], ["Days riding", perDay.filter(Boolean).length], ["Lines", new Set(last.map(r => r.line)).size]]} />
            <div className="bars" role="img" aria-label={`${plural(last.length, "ride")} in ${MONL[lm.getMonth()]}`}>
              {perDay.map((n, i) => <i key={i} className={n === 0 ? "zero" : i === busiest ? "top" : ""} style={{ height: n ? `${(n / maxDay) * 32}px` : "2px" }} />)}
            </div>
            <div className="bars-axis"><span>{MONL[lm.getMonth()].slice(0, 3)} 1</span><span>rides per day</span><span>{MONL[lm.getMonth()].slice(0, 3)} {days}</span></div>
            <p className="busiest">Busiest day: {DOWL[new Date(lm.getFullYear(), lm.getMonth(), busiest + 1).getDay()]}, {MONL[lm.getMonth()].slice(0, 3)} {busiest + 1}, {plural(maxDay, "ride")}</p>
            <p className="sub-h">Most ridden</p>
            <TopLines list={last} />
          </section>
        ) : (
          <section className="first-recap">
            <p className="kicker">Monthly recap</p>
            <i className="hr" />
            <h2 className="t-page">{MONL[t.getMonth()]}</h2>
            <p>Your first recap arrives {MONL[(t.getMonth() + 1) % 12]} 1: your hours underground, the lines you rode most and your busiest day.</p>
          </section>
        )}
        {!replay && year.length > 0 && (
          <section className="rc-sec">
            <h2 className="sec-h">{y} so far</h2>
            <Stats items={[["Hours", hoursOf(year)], ["Rides", year.length], ["Days riding", daysOf(year)]]} />
            <Bands y={y} list={year} />
            {/* The poster teaser waits for December, the month before it opens. */}
            {t.getMonth() === 11 && (
              <div className="drawn-row soon">
                <div><h2 className="t-card">{y},<br />Drawn.</h2><p>Your year as one poster: every print, your hours and your lines. Opens January 1.</p></div>
              </div>
            )}
            <button type="button" className="rc-link" onClick={() => nav.push({ kind: "year" })}>See every print so far ›</button>
          </section>
        )}
      </div>
    </div>
  );
}
