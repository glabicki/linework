import { describe, expect, it } from "vitest";
import { dueCards, yearCols } from "@/lib/recaps";
import type { Ride, Settings } from "@/lib/rides";

const on = { weekly: true, monthly: true, yearly: true };
const base: Settings = { lines: [], recaps: on, onboarded: true, backedUp: "2026-11-01" };
const ride = (day: string, line: Ride["line"] = "A"): Ride => ({ id: day + line, day, line, min: 20, est: true, at: 0 });
const at = (k: string, h = 12) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, h); };

describe("weekly recap", () => {
  const rides = [ride("2026-11-03"), ride("2026-11-04", "L"), ride("2026-11-10")];
  it("shows last week until Sunday 7 pm", () => {
    const c = dueCards(at("2026-11-15", 13), rides, base);
    expect(c[0]).toMatchObject({ id: "week-2026-11-02", title: "40 min underground", body: "Nov 2 – 8 · 2 rides on 2 lines" });
  });
  it("switches to this week on Sunday evening", () => {
    expect(dueCards(at("2026-11-15", 19), rides, base)[0].id).toBe("week-2026-11-09");
  });
  it("stays away once closed, when turned off, or for an empty week", () => {
    expect(dueCards(at("2026-11-15"), rides, { ...base, seen: ["week-2026-11-02"] })).toEqual([]);
    expect(dueCards(at("2026-11-15"), rides, { ...base, recaps: { ...on, weekly: false } })).toEqual([]);
    expect(dueCards(at("2026-11-29"), rides, base)).toEqual([]); // Nov 16 – 22 had no rides
  });
});

describe("monthly and yearly", () => {
  it("shows last month in the first week", () => {
    const c = dueCards(at("2026-12-03"), [ride("2026-11-10"), ride("2026-11-11")], base);
    expect(c.map(x => x.id)).toContain("month-2026-11");
    expect(dueCards(at("2026-12-09"), [ride("2026-11-10")], base).map(x => x.id)).not.toContain("month-2026-11");
  });
  it("shows the year in early January", () => {
    const c = dueCards(at("2027-01-02"), [ride("2026-06-01"), ride("2026-06-02")], base);
    expect(c[0]).toMatchObject({ id: "year-2026", title: "2 prints", year: 2026 });
  });
});

describe("backup nudge", () => {
  const many = Array.from({ length: 10 }, (_, i) => ride(`2026-10-${String(i + 10)}`));
  it("asks after ten rides with no backup in 30 days", () => {
    expect(dueCards(at("2026-11-20"), many, { ...base, backedUp: undefined }).map(c => c.kind)).toContain("backup");
    expect(dueCards(at("2026-11-20"), many, { ...base, backedUp: "2026-11-10" }).map(c => c.kind)).not.toContain("backup");
    expect(dueCards(at("2026-11-20"), many.slice(0, 9), { ...base, backedUp: undefined }).map(c => c.kind)).not.toContain("backup");
  });
});

describe("year grid", () => {
  it("uses big prints for a short year and small ones for a full one", () => {
    expect(yearCols(7)).toBe(3);
    expect(yearCols(46)).toBe(7);
    expect(yearCols(365)).toBeGreaterThanOrEqual(15);
    expect(yearCols(366)).toBeLessThanOrEqual(18);
  });
});
