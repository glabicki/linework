import { GEO, STATIONS, STOPS, paperInk, type Line } from "./lines";

// Map space the routes are drawn in (projected from GTFS shapes).
export const HOME = { x: -3500, y: -12500, w: 20000, h: 25000 };
// The closest a print zooms in, so a short ride still reads at print size.
const MIN_W = 8000;

type Pt = [number, number];

export function hash(s: string) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plotter line: resample, round the corners, then a slow wobble along the normal.
// Keeps each point's distance along the route, so a stretch of it can be cut out.
type Plot = { pts: Pt[]; raw: Pt[]; s: number[] };
const plotCache = new Map<string, Plot>();
function plot(line: Line, seedKey: string): Plot {
  const key = line + "|" + seedKey;
  const hit = plotCache.get(key);
  if (hit) return hit;
  const pts = GEO[line];
  const r = rng(hash(seedKey)), step = 140, out: Pt[] = [], at: number[] = [];
  let run = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) { out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]); at.push(run + (len * k) / n); }
    run += len;
  }
  out.push(pts[pts.length - 1]); at.push(run);
  let p = out;
  for (let pass = 0; pass < 3; pass++)
    p = p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + 2 * q[0] + p[i + 1][0]) / 4, (p[i - 1][1] + 2 * q[1] + p[i + 1][1]) / 4]));
  const f1 = 700 + r() * 500, f2 = 1900 + r() * 900, a1 = r() * 6.28, a2 = r() * 6.28, amp = 34 + r() * 22;
  let s = 0;
  const w = p.map((q, i): Pt => {
    if (i) s += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]);
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    const o = amp * (0.62 * Math.sin(s / f1 + a1) + 0.38 * Math.sin(s / f2 + a2));
    return [q[0] + nx * o, q[1] + ny * o];
  });
  const res = { pts: w, raw: out, s: at };
  plotCache.set(key, res);
  return res;
}

const toD = (pts: Pt[]) => "M" + pts.map(q => q[0].toFixed(0) + " " + q[1].toFixed(0)).join("L");

// The whole route, drawn by hand.
const pathCache = new Map<string, string>();
export function handPath(line: Line, seedKey: string) {
  const key = line + "|" + seedKey;
  const hit = pathCache.get(key);
  if (hit) return hit;
  const d = toD(plot(line, seedKey).pts);
  pathCache.set(key, d);
  return d;
}

// The part of a plotted route between two distances along it, in the order given.
export function cut(pts: Pt[], s: number[], a: number, b: number): Pt[] {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const at = (v: number): Pt => {
    const i = s.findIndex(x => x >= v);
    if (i < 0) return pts[pts.length - 1];
    if (i === 0) return pts[0];
    const t = (v - s[i - 1]) / (s[i] - s[i - 1] || 1);
    return [pts[i - 1][0] + t * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + t * (pts[i][1] - pts[i - 1][1])];
  };
  const out: Pt[] = [at(lo)];
  for (let i = 0; i < s.length; i++) if (s[i] > lo && s[i] < hi) out.push(pts[i]);
  out.push(at(hi));
  return a <= b ? out : out.reverse();
}

// Anything with a line and, if known, where you got on and off. A Ride is one.
export type Leg = { line: Line; from?: string; to?: string };

// Where a ride starts and ends along its line's drawn route. null when that isn't known
// (no stations, or a branch the drawing doesn't follow): the print then draws the whole line.
export function stretch(leg: Leg): [number, number] | null {
  const names = STATIONS[leg.line], at = STOPS[leg.line];
  // A station list refreshed without its positions draws whole lines until stops.json is rebuilt.
  if (!names || !at || at.length !== names.length || !leg.from || !leg.to) return null;
  const a = at[names.findIndex(x => x[0] === leg.from)], b = at[names.findIndex(x => x[0] === leg.to)];
  if (a == null || b == null || a === b) return null;
  return [a, b];
}

// One line's rides as the stretches to draw: overlapping or touching rides join into one
// (a ride there and back is one line), each drawn in the direction it was first ridden.
// null when any ride on the line is a whole-line ride.
export function stretches(legs: Leg[]): [number, number][] | null {
  const all = legs.map(stretch);
  if (!all.length || all.some(x => !x)) return null;
  const items = (all as [number, number][]).map(([a, b], n) => ({ lo: Math.min(a, b), hi: Math.max(a, b), up: a <= b, n })).sort((p, q) => p.lo - q.lo);
  const merged: typeof items = [];
  for (const it of items) {
    const last = merged[merged.length - 1];
    if (last && it.lo <= last.hi) { last.hi = Math.max(last.hi, it.hi); if (it.n < last.n) { last.n = it.n; last.up = it.up; } }
    else merged.push({ ...it });
  }
  return merged.sort((p, q) => p.n - q.n).map(m => (m.up ? [m.lo, m.hi] : [m.hi, m.lo]));
}

export type Stroke = { key: string; line: Line; d: string; color: string; dx: number; dy: number; box: [number, number, number, number]; whole: boolean };

const boxOf = (pts: Pt[]): Stroke["box"] => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
};

// Thin strokes per line, in the order first ridden: the stretch you rode when the stations are
// known, otherwise the whole line. Repeat rides show in the count, not the ink.
export function strokesFor(dayKey: string, legs: Leg[]): Stroke[] {
  return [...new Set(legs.map(l => l.line))].flatMap((line, i): Stroke[] => {
    const r = rng(hash(dayKey + line + i));
    const seed = line + ":" + i, color = paperInk(line), dx = (r() - 0.5) * 150, dy = (r() - 0.5) * 150;
    const spans = stretches(legs.filter(l => l.line === line));
    if (!spans) return [{ key: line, line, d: handPath(line, seed), color, dx, dy, box: boxOf(GEO[line]), whole: true }];
    const p = plot(line, seed);
    return spans.map(([a, b], k) => ({ key: `${line}.${k}`, line, d: toD(cut(p.pts, p.s, a, b)), color, dx, dy, box: boxOf(cut(p.raw, p.s, a, b)), whole: false }));
  });
}

// The sheet's frame, kept at the print's 4:5. With a whole line on it, the whole city, grown to fit;
// with only stretches, just what you rode, zoomed in no further than MIN_W.
export function frameFor(strokes: Stroke[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const { box } of strokes) { x0 = Math.min(x0, box[0] - 1200); y0 = Math.min(y0, box[1] - 1200); x1 = Math.max(x1, box[2] + 1200); y1 = Math.max(y1, box[3] + 1200); }
  if (!strokes.length || strokes.some(s => s.whole)) {
    x0 = Math.min(x0, HOME.x); y0 = Math.min(y0, HOME.y); x1 = Math.max(x1, HOME.x + HOME.w); y1 = Math.max(y1, HOME.y + HOME.h);
  } else {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = Math.max(x1 - x0, MIN_W) / 2, hh = Math.max(y1 - y0, MIN_W / 0.8) / 2;
    x0 = cx - hw; x1 = cx + hw; y0 = cy - hh; y1 = cy + hh;
  }
  let w = x1 - x0, h = y1 - y0;
  if (w / h > 0.8) { const nh = w / 0.8; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * 0.8; x0 -= (nw - w) / 2; w = nw; }
  return { x: x0, y: y0, w, h };
}

// Stroke width in map units. Bigger frames thin a little less than they grow; zoomed-in frames
// keep the same weight on the sheet, so every print reads as one thin line.
export const strokeWidth = (frameW: number, base = 300) => { const k = frameW / HOME.w; return base * (k >= 1 ? Math.pow(k, 0.6) : k); };

// Small square mark of one line's route, for grids and rows.
export function markBox(line: Line, pad = 1.2) {
  const pts = GEO[line];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const s = Math.max(x1 - x0, y1 - y0, 2600) * pad;
  return { x: (x0 + x1) / 2 - s / 2, y: (y0 + y1) / 2 - s / 2, s };
}
