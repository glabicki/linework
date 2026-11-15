"use client";
import { Back } from "./RideSheet";
import type { Nav } from "./App";

const STEPS: [string, string][] = [
  ["Tap Share", "The square with an arrow, at the bottom of Safari."],
  ["Tap Add to Home Screen", "Scroll the list if you don’t see it."],
  ["Tap Add", "Then open Linework from your Home Screen. Your rides come with it."],
];

// Figma 178:4307 Add to Home Screen
export default function HomeScreen({ nav }: { nav: Nav }) {
  return (
    <div className="sheet">
      <Back onClick={nav.pop} />
      <div className="page-copy">
        <h1 className="t-large">Put Linework on your Home Screen.</h1>
        <p>It opens like an app, works on the train with no signal, and keeps your rides from being cleared when you’re away.</p>
      </div>
      <div className="sheet-rows">
        <i className="hr" />
        {STEPS.map(([h, p], i) => (
          <div key={h} className="frow step"><span className="n">{i + 1}</span><span className="txt"><b>{h}</b><span>{p}</span></span></div>
        ))}
      </div>
      <footer className="sheet-foot"><button type="button" className="btn" onClick={nav.pop}>Got it</button></footer>
    </div>
  );
}
