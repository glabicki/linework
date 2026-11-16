import { describe, expect, it } from "vitest";
import { backupJSON, mergeRides, parseBackup, timing, toCSV, usualMin, type Ride, type Settings } from "@/lib/rides";

const ride = (p: Partial<Ride>): Ride => ({ id: Math.random().toString(36), day: "2026-11-15", line: "A", min: 20, est: true, at: 1, ...p });
const settings: Settings = { lines: ["L"], recaps: { weekly: true, monthly: true, yearly: true }, onboarded: true };

describe("ride times", () => {
  it("uses the schedule when stations are known", () => {
    const t = timing("L", "Bedford Av", "8 Av");
    expect(t.est).toBe(false);
    expect(t.min).toBeGreaterThan(0);
  });
  it("falls back to your usual time on the line, then a typical ride", () => {
    const typical = timing("A").min;
    const history = [ride({ min: 30, est: false }), ride({ min: 34, est: false }), ride({ min: 40, est: false })];
    expect(usualMin("A", history)).toBe(34);
    expect(timing("A", undefined, undefined, history)).toEqual({ min: 34, est: true });
    expect(usualMin("A", history.slice(0, 1))).toBeUndefined(); // one ride isn't a habit
    expect(timing("A", undefined, undefined, [ride({ line: "L", min: 5, est: false })]).min).toBe(typical);
  });
});

describe("backup", () => {
  it("round-trips through a file", () => {
    const rides = [ride({ id: "a" }), ride({ id: "b", line: "L" })];
    const back = parseBackup(backupJSON({ rides, settings }));
    expect(back.rides).toEqual(rides);
    expect(back.settings?.lines).toEqual(["L"]);
  });
  it("rejects files that aren't backups and drops broken rides", () => {
    expect(() => parseBackup('{"hello":1}')).toThrow();
    expect(() => parseBackup("not json")).toThrow();
    const text = JSON.stringify({ app: "linework", rides: [ride({ id: "ok" }), { id: 3 }, ride({ id: "bad", day: "Nov 1" })] });
    expect(parseBackup(text).rides.map(r => r.id)).toEqual(["ok"]);
  });
  it("merges without duplicates, in logging order", () => {
    const mine = [ride({ id: "a", at: 2 })];
    const theirs = [ride({ id: "a", at: 2 }), ride({ id: "b", at: 1 })];
    expect(mergeRides(mine, theirs).map(r => r.id)).toEqual(["b", "a"]);
  });
});

describe("export", () => {
  it("writes a spreadsheet row per ride, quoting stations", () => {
    const csv = toCSV([ride({ from: "Jay St-MetroTech", to: '14 "St"', time: "08:41", min: 12, est: false })]);
    expect(csv.split("\n")).toEqual(["date,time,line,from,to,minutes,timing,caption", '2026-11-15,08:41,A,"Jay St-MetroTech","14 ""St""",12,scheduled,']);
  });
});
