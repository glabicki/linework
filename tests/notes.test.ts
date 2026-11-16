import { describe, expect, it } from "vitest";
import { captionFor, factFor, yourWords } from "@/lib/notes";
import { backupJSON, parseBackup, type Ride, type Settings } from "@/lib/rides";
import { posterSvg } from "@/lib/poster";

let n = 0;
const ride = (day: string, line: string, min = 20): Ride => ({ id: String(n++), day, line: line as Ride["line"], min, est: true, at: n });
const settings: Settings = { lines: [], recaps: { weekly: true, monthly: true, yearly: true }, onboarded: true };

describe("captions", () => {
  const rides = [ride("2026-10-01", "L"), ride("2026-10-01", "A"), ride("2026-10-02", "L"), ride("2026-10-03", "G"), ride("2026-10-04", "L"), ride("2026-10-04", "GS")];
  it("say a quiet fact when you wrote nothing", () => {
    expect(factFor("2026-10-01", rides)).toBe("Your first print");
    expect(factFor("2026-10-02", rides)).toBeUndefined(); // an ordinary day says nothing
    expect(factFor("2026-10-03", rides)).toBe("First time on the G");
    expect(factFor("2026-10-04", rides)).toBe("First time on the 42 St Shuttle");
    expect(factFor("2026-10-05", rides)).toBeUndefined(); // no rides, no caption
  });
  it("use your own words over the fact", () => {
    expect(captionFor("2026-10-03", rides, { "2026-10-03": "Maya’s birthday" })).toBe("Maya’s birthday");
    expect(captionFor("2026-10-03", rides, { "2026-10-03": "  " })).toBe("First time on the G");
  });
  it("mark records and round numbers", () => {
    const many = [...Array(9)].flatMap((_, i) => [ride(`2026-09-${String(i + 1).padStart(2, "0")}`, "L")]);
    expect(factFor("2026-09-10", [...many, ride("2026-09-10", "L")])).toBe("Your 10th print");
    const busy = [...many, ride("2026-09-10", "L"), ...["L", "L", "L", "L"].map(l => ride("2026-09-11", l))];
    expect(factFor("2026-09-11", busy)).toBe("Most rides in a day yet");
  });
  it("read the year back in a few, spread across it", () => {
    const notes = Object.fromEntries([...Array(10)].map((_, i) => [`2026-0${Math.floor(i / 3) + 1}-1${i % 3}`, `note ${i}`]));
    const w = yourWords(notes, 2026);
    expect(w.map(x => x.text)).toEqual(["note 0", "note 3", "note 6", "note 9"]);
    expect(yourWords(notes, 2025)).toEqual([]);
  });
  it("travel with the backup file", () => {
    const back = parseBackup(backupJSON({ rides, settings, notes: { "2026-10-03": "Maya’s birthday", bad: "x" } }));
    expect(back.notes).toEqual({ "2026-10-03": "Maya’s birthday" });
  });
  it("print under the date, escaped and cut to one line", () => {
    const svg = posterSvg({ day: "2026-10-03", legs: rides.slice(3, 4), rides: 1, size: [8, 10], paper: "white", caption: true, note: "Tom & Jo <3" });
    expect(svg).toContain(">Tom &amp; Jo &lt;3</text>");
    const mini = posterSvg({ day: "2026-10-03", legs: rides.slice(3, 4), rides: 1, size: [2, 3], paper: "white", caption: true, note: "A very long caption that keeps going on and on" });
    expect(mini).toMatch(/…<\/text>/);
    expect(posterSvg({ day: "2026-10-03", legs: rides.slice(3, 4), rides: 1, size: [8, 10], paper: "white", caption: false, note: "hidden" })).not.toContain("hidden");
  });
});
