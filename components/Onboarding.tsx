"use client";
import { useState } from "react";
import { DayCard, LineMark } from "./art";
import { Icon } from "./icons";
import { ORDER, label, lineName, type Line } from "@/lib/lines";
import { setSettings, timing, type Ride, type Settings } from "@/lib/rides";

// Sample days for the welcome screen, as in Figma 35:312.
const sample = (day: string, lines: Line[]): Ride[] => lines.map((line, i) => ({ id: day + i, day, line, ...timing(line), at: 0 }));
const HERO: [string, Ride[]][] = [
  ["2026-10-30", sample("2026-10-30", ["L", "A", "4", "L", "A", "4"])],
  ["2026-11-06", sample("2026-11-06", ["L", "A", "N", "A"])],
  ["2026-11-07", sample("2026-11-07", ["G", "7", "G"])],
];

function Nav({ step, onBack, onSkip }: { step: number; onBack: () => void; onSkip: () => void }) {
  return (
    <div className="topbar ob-nav">
      <button type="button" className="back" onClick={onBack} aria-label="Back"><Icon name="left" /></button>
      <div className="progress" aria-label={`Step ${step} of 2`}>{[1, 2].map(i => <i key={i} className={i <= step ? "on" : ""} />)}</div>
      <button type="button" className="skip" onClick={onSkip}>Skip</button>
    </div>
  );
}

// Figma 35:312 Welcome, 35:364 Your lines, 36:394 Recaps
export default function Onboarding({ settings }: { settings: Settings }) {
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<Line[]>(settings.lines);
  const [recaps, setRecaps] = useState(settings.recaps);
  const finish = (patch: Partial<Settings> = {}) => setSettings({ lines, onboarded: true, ...patch });
  const toggle = (l: Line) => setLines(ls => (ls.includes(l) ? ls.filter(x => x !== l) : [...ls, l]));

  if (step === 0) {
    return (
      <div className="sheet ob">
        <div className="ob-hero" aria-hidden="true">
          {HERO.map(([day, rides]) => <div key={day}><DayCard day={day} rides={rides} /></div>)}
        </div>
        <div className="page-copy">
          <h1 className="t-large">Every ride, drawn.</h1>
          <p>Tap the NYC subway lines you take. Each day becomes its own small print, and every week you see how long you spent underground. It’s free, with no account needed.</p>
        </div>
        <footer className="sheet-foot ob-foot">
          <button type="button" className="btn" onClick={() => setStep(1)}>Get started</button>
        </footer>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="sheet ob">
        <Nav step={1} onBack={() => setStep(0)} onSkip={() => finish()} />
        <div className="page-copy">
          <h1 className="t-large">Which lines do you ride most?</h1>
          <p>They show up first when you log a ride. You can change this anytime.</p>
        </div>
        <div className="grid ob-grid">
          {ORDER.map(l => (
            <button key={l} type="button" className={`cell${lines.includes(l) ? " lit" : ""}`} aria-pressed={lines.includes(l)} aria-label={lineName(l)} onClick={() => toggle(l)}>
              <span className="mark"><LineMark line={l} lit={lines.includes(l)} /></span>
              <span className="lab">{label(l)}</span>
            </button>
          ))}
        </div>
        <footer className="sheet-foot ob-foot sticky">
          <p className="hint soft">{lines.length === 1 ? "1 line selected" : `${lines.length} lines selected`}</p>
          <button type="button" className="btn" onClick={() => setStep(2)}>Continue</button>
        </footer>
      </div>
    );
  }

  const opt = (k: keyof Settings["recaps"], title: string, sub: string) => (
    <div className="ob-opt">
      <span className="txt"><b>{title}</b><span>{sub}</span></span>
      <button type="button" role="switch" aria-checked={recaps[k]} aria-label={`${title} recap`} className={`toggle${recaps[k] ? " on" : ""}`} onClick={() => setRecaps(r => ({ ...r, [k]: !r[k] }))} />
    </div>
  );
  return (
    <div className="sheet ob">
      <Nav step={2} onBack={() => setStep(1)} onSkip={() => finish()} />
      <div className="page-copy">
        <h1 className="t-large">How long were you underground?</h1>
        <p>Linework adds up your rides into a short recap. It waits for you on Today, under your print. Pick how often.</p>
      </div>
      <div className="ob-preview" aria-hidden="true">
        <div className="recap-card">
          <div className="rc-top"><p className="kicker">Weekly recap</p></div>
          <h2>6 h 40 min underground</h2>
          <p className="rc-body">Nov 9 – 15 · 18 rides on 4 lines</p>
        </div>
      </div>
      <div className="ob-opts">
        {opt("weekly", "Weekly", "Sundays at 7 pm")}
        {opt("monthly", "Monthly", "The 1st, at 9 am")}
        {opt("yearly", "Yearly", "January 1")}
      </div>
      <footer className="sheet-foot">
        <button type="button" className="btn" onClick={() => finish({ recaps })}>Turn on recaps</button>
        <button type="button" className="cancel" onClick={() => finish({ recaps: { weekly: false, monthly: false, yearly: false } })}>Not now</button>
      </footer>
    </div>
  );
}
