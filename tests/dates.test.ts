import { describe, expect, it } from "vitest";
import { addDays, dayShort, fmtH, keyOf, plural, to12, weekStart } from "@/lib/dates";

describe("dates", () => {
  it("weeks start on Monday", () => {
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday belongs to the week before
    expect(weekStart("2026-11-09")).toBe("2026-11-09");
    expect(weekStart("2026-01-01")).toBe("2025-12-29"); // across New Year
  });
  it("adds days across months, years and DST", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02"); // clocks go back Nov 1
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09"); // clocks go forward Mar 8
  });
  it("keys a local date", () => expect(keyOf(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05"));
  it("formats", () => {
    expect(fmtH(59)).toBe("59 min");
    expect(fmtH(60)).toBe("1 h");
    expect(fmtH(89)).toBe("1 h 29 min");
    expect(plural(1, "ride")).toBe("1 ride");
    expect(plural(0, "ride")).toBe("0 rides");
    expect(to12("00:05")).toBe("12:05 am");
    expect(to12("18:15")).toBe("6:15 pm");
    expect(dayShort("2026-11-15")).toBe("Sun 15");
  });
});
