"use client";
import { COLOR, label, type Line } from "@/lib/lines";
import { MONL, addDays, dateOf, keyOf, plural } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";
import type { Nav } from "./App";
import { TabHead } from "./Prints";
import { DayPrint } from "./art";

function topLines(list: Ride[], n: number) {
  const c = new Map<Line, number>();
  list.forEach(r => c.set(r.line, (c.get(r.line) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

// The year card: one band per line, as wide as its share of the year's rides.
function Drawn({ y, list, ready, nav }: { y: number; list: Ride[]; ready: boolean; nav: Nav }) {
  const top = topLines(list, 6);
  const topN = top.reduce((a, [, n]) => a + n, 0);
  return (
    <section className="drawn">
      <div className="bands" role="img" aria-label={top.length ? `Lines you rode most in ${y}: ${top.map(([l, n]) => `${label(l)}, ${plural(n, "ride")}`).join("; ")}` : "No rides yet this year"}>
        {top.length ? top.map(([l, n]) => <i key={l} style={{ background: COLOR[l], flexGrow: n }} />) : [...Array(5)].map((_, i) => <i key={i} className="empty" />)}
      </div>
      {top.length > 0 && (
        <div className="band-keys" aria-hidden="true">
          {top.map(([l, n]) => <span key={l} style={{ flexGrow: n }}>{n / topN >= 0.07 ? label(l) : ""}</span>)}
        </div>
      )}
      <i className="hr" />
      <div className="drawn-row">
        {ready ? (
          <>
            <div><h2 className="t-card">{y},<br />Drawn.</h2><p>Your year in lines. Your {y} print is ready to save.</p></div>
            <button type="button" onClick={() => nav.push({ kind: "story", year: y })}>Play ›</button>
          </>
        ) : (
          <>
            <div><h2 className="t-card">{y},<br />Drawn.</h2><p>Your year as one poster: every print, your hours and your lines. Opens January 1.</p></div>
            <button type="button" onClick={() => nav.push({ kind: "year" })}>See it so far ›</button>
          </>
        )}
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
        {replay && <Drawn y={y - 1} list={lastYear} ready nav={nav} />}
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
          <section className="hero-recap">
            <p className="t-label">{MONL[lm.getMonth()]} · Underground</p>
            <div className="total"><span className="t-hero">{h}</span><span>{h === 1 ? "hour" : "hours"}</span></div>
            <p className="note">
              About {perDayH >= 1 ? `${Math.round(perDayH)} h` : `${Math.round(perDayH * 60)} min`} a day
              {!before.length ? "." : h === hb ? `, about the same as ${MONL[prev.getMonth()]}.` : `, and ${Math.abs(h - hb)} h ${h > hb ? "more" : "less"} than ${MONL[prev.getMonth()]}.`}
            </p>
            <div className="bars" role="img" aria-label={`${plural(last.length, "ride")} in ${MONL[lm.getMonth()]}`}>
              {perDay.map((n, i) => <i key={i} className={n === 0 ? "zero" : i === busiest ? "top" : ""} style={{ height: n ? `${(n / maxDay) * 32}px` : "2px" }} />)}
            </div>
            <div className="bars-axis"><span>{MONL[lm.getMonth()].slice(0, 3)} 1</span><span>rides per day</span><span>{MONL[lm.getMonth()].slice(0, 3)} {days}</span></div>
          </section>
        ) : (
          <section className="first-recap">
            <p className="kicker">Monthly recap</p>
            <i className="hr" />
            <h2 className="t-page">{MONL[t.getMonth()]}</h2>
            <p>Your first recap arrives {MONL[(t.getMonth() + 1) % 12]} 1: your hours underground, the lines you rode most and your busiest day.</p>
          </section>
        )}
        {!replay && <Drawn y={y} list={year} ready={false} nav={nav} />}
      </div>
    </div>
  );
}
