import { describe, expect, it } from "vitest";
import { HOME, cut, frameFor, handPath, stretch, stretches, strokesFor } from "@/lib/art";

describe("the stretch you rode", () => {
  it("places both stations along the drawn route", () => {
    const s = stretch({ line: "L", from: "Bedford Av", to: "8 Av" })!;
    expect(s[0]).toBeGreaterThan(s[1]);
    expect(s[0] - s[1]).toBeGreaterThan(3000); // Bedford Av is a river and four stops from 8 Av
  });

  it("draws the whole line without both stations, or off the drawn branch", () => {
    expect(stretch({ line: "L" })).toBeNull();
    expect(stretch({ line: "L", from: "Bedford Av" })).toBeNull();
    expect(stretch({ line: "L", from: "Bedford Av", to: "Bedford Av" })).toBeNull();
    expect(stretch({ line: "A", from: "Jay St-MetroTech", to: "Far Rockaway-Mott Av" })).toBeNull();
  });

  it("joins a ride there and back into one stretch, drawn the way it was first ridden", () => {
    const out = { line: "L", from: "Bedford Av", to: "8 Av" }, back = { line: "L", from: "8 Av", to: "Bedford Av" };
    const s = stretches([out, back])!;
    expect(s).toHaveLength(1);
    expect(s[0]).toEqual(stretch(out));
  });

  it("joins rides that meet, keeps apart ones that don't", () => {
    const a = { line: "A", from: "Jay St-MetroTech", to: "14 St" }, b = { line: "A", from: "14 St", to: "125 St" };
    const far = { line: "A", from: "Utica Av", to: "Broadway Junction" };
    expect(stretches([a, b])).toHaveLength(1);
    expect(stretches([a, far])).toHaveLength(2);
  });

  it("falls back to the whole line when any ride on it has no stations", () => {
    expect(stretches([{ line: "L", from: "Bedford Av", to: "8 Av" }, { line: "L" }])).toBeNull();
  });
});

describe("strokes and frame", () => {
  it("draws whole-line days exactly as before", () => {
    const s = strokesFor("2026-11-10", [{ line: "A" }, { line: "L" }, { line: "A" }]);
    expect(s.map(x => x.key)).toEqual(["A", "L"]);
    expect(s[0].d).toBe(handPath("A", "A:0"));
    expect(s.every(x => x.whole)).toBe(true);
    const f = frameFor(s);
    expect(f.x).toBeLessThanOrEqual(HOME.x);
    expect(f.w).toBeGreaterThanOrEqual(HOME.w);
  });

  it("frames just the stretches, at 4:5, zoomed in no closer than the minimum", () => {
    const s = strokesFor("2026-11-10", [{ line: "L", from: "Bedford Av", to: "8 Av" }, { line: "A", from: "14 St", to: "Jay St-MetroTech" }]);
    expect(s.map(x => x.key)).toEqual(["L.0", "A.0"]);
    const f = frameFor(s);
    expect(f.w).toBeLessThan(HOME.w);
    expect(f.w).toBeGreaterThanOrEqual(8000);
    expect(f.w / f.h).toBeCloseTo(0.8, 5);
    for (const { box } of s) {
      expect(box[0]).toBeGreaterThan(f.x); expect(box[2]).toBeLessThan(f.x + f.w);
      expect(box[1]).toBeGreaterThan(f.y); expect(box[3]).toBeLessThan(f.y + f.h);
    }
  });

  it("cuts a route in the direction ridden", () => {
    const pts: [number, number][] = [[0, 0], [100, 0], [200, 0], [300, 0]], s = [0, 100, 200, 300];
    expect(cut(pts, s, 50, 250)).toEqual([[50, 0], [100, 0], [200, 0], [250, 0]]);
    expect(cut(pts, s, 250, 50)).toEqual([[250, 0], [200, 0], [100, 0], [50, 0]]);
  });
});
