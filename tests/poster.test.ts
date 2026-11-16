import { describe, expect, it } from "vitest";
import { storySvg } from "@/lib/poster";

describe("Stories image", () => {
  it("draws a 9:16 image with the day under the print", () => {
    const svg = storySvg({ day: "2026-11-15", legs: [{ line: "L" }, { line: "A" }], rides: 2, minutes: 29 });
    expect(svg).toContain('viewBox="0 0 1080 1920"');
    expect(svg).toContain("Sunday, November 15");
    expect(svg).toContain("29 minutes underground · 2 rides");
  });
});
