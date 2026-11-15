"use client";
import { COLOR, label, type Line } from "@/lib/lines";
import { MONL, dateOf, keyOf, plural } from "@/lib/dates";
import { minutes, ridesOn, type Ride } from "@/lib/rides";

function topLines(list: Ride[], n: number) {
  const c = new Map<Line, number>();
  list.forEach(r => c.set(r.line, (c.get(r.line) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default function Recaps({ rides, today }: { rides: Ride[]; today: string }) {
  const t = dateOf(today);
  const year = rides.filter(r => r.day.startsWith(String(t.getFullYear())));
  const top = topLines(year, 5);
  const jan1 = new Date(t.getFullYear() + 1, 0, 1);
  const toGo = Math.ceil((jan1.getTime() - t.getTime()) / 864e5);

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

  return (
    <div className="screen">
      <header className="tab-head"><p className="t-caption muted">Your recaps</p><h1 className="t-page">Recaps</h1></header>

      <div className="stripes" aria-hidden="true">
        {top.length ? top.map(([l]) => <i key={l} style={{ background: COLOR[l] }} />) : [...Array(5)].map((_, i) => <i key={i} className="empty-stripe" />)}
      </div>
      <div className="rule" />
      <div className="drawn-card">
        <h2 className="t-card">{t.getFullYear()},<br />Drawn.</h2>
        <div className="drawn-foot">
          <span className="t-caption muted">Opens January 1.{toGo < 120 ? ` ${plural(toGo, "day")} to go.` : ""}</span>
          <span className="t-row">See it so far ›</span>
        </div>
      </div>
      <div className="rule" />

      {last.length ? (
        <section className="month-recap">
          <p className="t-label muted">{MONL[lm.getMonth()]} · Underground</p>
          <div className="hero"><span className="t-hero">{h}</span><span className="t-title">{h === 1 ? "hour" : "hours"}</span></div>
          <p className="t-caption muted">
            About {perDayH >= 1 ? `${Math.round(perDayH)} h` : `${Math.round(perDayH * 60)} min`} a day
            {before.length ? `, and ${Math.abs(h - hb)} h ${h >= hb ? "more" : "less"} than ${MONL[prev.getMonth()]}.` : "."}
          </p>
          <div className="bars" role="img" aria-label={`${plural(last.length, "ride")} in ${MONL[lm.getMonth()]}`}>
            {perDay.map((n, i) => <i key={i} style={{ height: `${(n / maxDay) * 100}%` }} />)}
          </div>
          <div className="bars-axis t-tab muted"><span>{MONL[lm.getMonth()].slice(0, 3)} 1</span><span>rides per day</span><span>{MONL[lm.getMonth()].slice(0, 3)} {days}</span></div>
          {top.length > 0 && (
            <p className="t-caption muted top-line">Most ridden this year: {label(top[0][0])}, {plural(top[0][1], "ride")}.</p>
          )}
        </section>
      ) : (
        <section className="month-recap">
          <p className="t-label muted">Monthly recap</p>
          <div className="rule" />
          <h2 className="t-page">{MONL[t.getMonth()]}</h2>
          <p className="t-caption muted">Your first recap arrives {MONL[(t.getMonth() + 1) % 12]} 1: your hours underground, the lines you rode most and your busiest day.</p>
        </section>
      )}
    </div>
  );
}
