import { describe, expect, it } from "vitest";
import { SIZES, inkRow } from "@/lib/poster";

// Caption widths as posterSvg measures them, for the longest date there is.
const title = "Wednesday, September 30, 2026".length, sub = "16 lines · 99 rides".length;

describe("caption ink dots", () => {
  it("sit beside the date when there are only a few", () => {
    expect(inkRow(3, 856, 25 * 34 * 0.6, sub * 25 * 0.55).row).toBe("title");
  });
  it("sit with the line count on the mini print, even when there are few", () => {
    expect(inkRow(3, 856, 25 * 34 * 1.6 * 0.6, sub * 25 * 1.6 * 0.55, 1.6).row).toBe("sub");
  });
  it("never run into the words, at any size, with every ink", () => {
    for (const [iw] of SIZES) {
      const k = iw < 4 ? 1.6 : 1;
      for (let n = 1; n <= 11; n++) {
        const tW = title * 34 * k * 0.6, sW = sub * 25 * k * 0.55;
        const d = inkRow(n, 856, tW, sW, k);
        const words = d.row === "title" ? tW : sW;
        expect(words + d.width).toBeLessThanOrEqual(856);
        expect(d.step).toBeGreaterThanOrEqual(d.r * 2);
      }
    }
  });
});
