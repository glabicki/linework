import geoJson from "./data/geo.json";
import stationsJson from "./data/stations.json";

export type Line = string;
type Pt = [number, number];

export const GEO = geoJson as unknown as Record<Line, Pt[]>;
export const STATIONS = stationsJson as unknown as Record<Line, [string, number][]>;

// Grid order, the way the map legend runs.
export const ORDER: Line[] = ["1", "2", "3", "4", "5", "6", "7", "A", "C", "E", "B", "D", "F", "M", "N", "Q", "R", "W", "G", "J", "Z", "L", "GS", "FS", "H", "SI"];

// Screen colors (line/* in Figma, Screen mode).
export const COLOR: Record<Line, string> = {
  "1": "#E04A3C", "2": "#E04A3C", "3": "#E04A3C",
  "4": "#219653", "5": "#219653", "6": "#219653",
  "7": "#A84BA6",
  A: "#2E5BC9", C: "#2E5BC9", E: "#2E5BC9",
  B: "#F07A35", D: "#F07A35", F: "#F07A35", M: "#F07A35",
  G: "#79BF4E",
  J: "#A36F3F", Z: "#A36F3F",
  L: "#9A9893",
  N: "#F5BF2E", Q: "#F5BF2E", R: "#F5BF2E", W: "#F5BF2E",
  GS: "#7A7772", FS: "#7A7772", H: "#7A7772",
  SI: "#5A86B8",
};

// Paper mode: the light inks go deeper so they hold up on white.
const PAPER: Record<string, string> = { "#F5BF2E": "#AF7B00", "#79BF4E": "#50941C", "#F07A35": "#D86416", "#9A9893": "#85837E", "#5A86B8": "#2D4A8A" };
export const paperInk = (l: Line) => PAPER[COLOR[l]] ?? COLOR[l];

// Text on a line's color: dark on the light lines, white on the rest.
const DARK_TEXT = new Set(["#F5BF2E", "#79BF4E", "#9A9893", "#F07A35"]);
export const textOn = (l: Line) => (DARK_TEXT.has(COLOR[l]) ? "#1c1a18" : "#ffffff");

export const LABEL: Record<Line, string> = { GS: "42 St", FS: "Franklin", H: "Rockaway", SI: "SIR" };
export const NAME: Record<Line, string> = { GS: "42 St Shuttle", FS: "Franklin Av Shuttle", H: "Rockaway Park Shuttle", SI: "Staten Island Railway" };
export const label = (l: Line) => LABEL[l] ?? l;
export const lineName = (l: Line) => NAME[l] ?? `the ${l}`;
export const LineTitle = (l: Line) => NAME[l] ?? `The ${l}`;

const WEEKDAY_ONLY: Record<Line, [string, string]> = {
  W: ["Weekdays only", "The W runs weekdays only."],
  B: ["Weekdays only", "The B runs weekdays only."],
  Z: ["Weekday rush hours only", "The Z runs weekday rush hours only."],
};
const SERVICE: Record<Line, [string, string]> = {
  GS: ["No late nights", "The 42 St Shuttle doesn’t run late nights."],
  C: ["No late nights", "The C doesn’t run late nights; the A runs local."],
  "5": ["Late nights", "Late nights the 5 runs only in the Bronx."],
  ...WEEKDAY_ONLY,
};
export function serviceNote(l: Line, weekend: boolean): { title: string; body: string } | null {
  if (weekend && WEEKDAY_ONLY[l]) return { title: WEEKDAY_ONLY[l][0], body: `${WEEKDAY_ONLY[l][1]} If your train said ${label(l)}, log it anyway.` };
  const n = SERVICE[l];
  return n ? { title: n[0], body: n[1] } : null;
}

// Minutes: scheduled time between two stations, or a typical ride when stations aren't set.
const fullMin = (l: Line) => { const s = STATIONS[l]; return s ? s[s.length - 1][1] : 20; };
export const typicalMin = (l: Line) => Math.max(3, Math.min(25, Math.round(fullMin(l) * 0.28)));
export function scheduledMin(l: Line, from?: string, to?: string) {
  const s = STATIONS[l] ?? [];
  const i = s.findIndex(x => x[0] === from), j = s.findIndex(x => x[0] === to);
  if (i < 0 || j < 0 || i === j) return null;
  return Math.max(2, Math.round(Math.abs(s[j][1] - s[i][1])));
}

// Station names read with en dashes, as on MTA signs ("Jay St–MetroTech").
export const stationName = (s?: string) => (s ?? "").replace(/-/g, "–");
