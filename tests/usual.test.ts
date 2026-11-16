import { describe, expect, it } from "vitest";
import { usualRide, usualStretch } from "@/lib/usual";
import { addDays } from "@/lib/dates";
import type { Ride } from "@/lib/rides";

let n = 0;
const ride = (day: string, line: string, from?: string, to?: string, time?: string): Ride =>
  ({ id: String(n++), day, line, from, to, time, min: 12, est: false, at: Date.parse(day + "T" + (time ?? "12:00")) });

// Two weeks of weekday commutes: L to Manhattan in the morning, back in the evening.
const TODAY = "2026-11-16"; // a Monday
const commute: Ride[] = [];
for (let k = addDays(TODAY, -14); k < TODAY; k = addDays(k, 1)) {
  const g = new Date(k + "T12:00").getDay();
  if (g === 0 || g === 6) continue;
  commute.push(ride(k, "L", "Bedford Av", "8 Av", "08:40"), ride(k, "L", "8 Av", "Bedford Av", "18:10"));
}

describe("usual stretch for a quick tap", () => {
  it("is the stretch you ride most, the way you go at this time of day", () => {
    expect(usualStretch("L", commute, TODAY, 8 * 60)).toEqual({ from: "Bedford Av", to: "8 Av" });
    expect(usualStretch("L", commute, TODAY, 19 * 60)).toEqual({ from: "8 Av", to: "Bedford Av" });
  });

  it("is the way back after riding it earlier the same day", () => {
    const today = [...commute, ride(TODAY, "L", "Bedford Av", "8 Av", "08:40")];
    expect(usualStretch("L", today, TODAY, 9 * 60)).toEqual({ from: "8 Av", to: "Bedford Av" });
  });

  it("needs at least two rides with stations on that line", () => {
    expect(usualStretch("A", commute, TODAY, 8 * 60)).toBeUndefined();
    expect(usualStretch("G", [ride("2026-11-10", "G", "Nassau Av", "Court Sq")], TODAY, 8 * 60)).toBeUndefined();
    expect(usualStretch("G", [ride("2026-11-10", "G"), ride("2026-11-11", "G")], TODAY, 8 * 60)).toBeUndefined();
  });

  it("forgets rides older than the window", () => {
    const old = [ride("2026-03-02", "L", "Lorimer St", "1 Av"), ride("2026-03-03", "L", "Lorimer St", "1 Av")];
    expect(usualStretch("L", old, TODAY, 8 * 60)).toBeUndefined();
  });
});

describe("usual ride around now", () => {
  it("suggests the morning commute in the morning, the ride home in the evening", () => {
    expect(usualRide(commute, TODAY, 8 * 60 + 30)).toEqual({ line: "L", from: "Bedford Av", to: "8 Av" });
    expect(usualRide(commute, TODAY, 18 * 60)).toEqual({ line: "L", from: "8 Av", to: "Bedford Av" });
  });

  it("suggests nothing far from your usual times, or on a weekend", () => {
    expect(usualRide(commute, TODAY, 13 * 60)).toBeUndefined();
    expect(usualRide(commute, "2026-11-21", 8 * 60 + 30)).toBeUndefined(); // Saturday
  });

  it("goes away once you've logged it today", () => {
    const today = [...commute, ride(TODAY, "L", "Bedford Av", "8 Av", "08:41")];
    expect(usualRide(today, TODAY, 8 * 60 + 45)).toBeUndefined();
  });

  it("needs three different days", () => {
    expect(usualRide(commute.slice(0, 4), TODAY, 8 * 60 + 30)).toBeUndefined();
  });
});
