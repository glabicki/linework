import { GEO, paperInk, type Line } from "./lines";

// Map space the routes are drawn in (projected from GTFS shapes).
export const HOME = { x: -3500, y: -12500, w: 20000, h: 25000 };

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
const pathCache = new Map<string, string>();
export function handPath(line: Line, seedKey: string) {
  const key = line + "|" + seedKey;
  const hit = pathCache.get(key);
  if (hit) return hit;
  const pts = GEO[line];
  const r = rng(hash(seedKey)), step = 140, out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let k = 0; k < n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  let p = out;
  for (let pass = 0; pass < 3; pass++)
    p = p.map((q, i) => (i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + 2 * q[0] + p[i + 1][0]) / 4, (p[i - 1][1] + 2 * q[1] + p[i + 1][1]) / 4]));
  const f1 = 700 + r() * 500, f2 = 1900 + r() * 900, a1 = r() * 6.28, a2 = r() * 6.28, amp = 34 + r() * 22;
  let s = 0;
  const w = p.map((q, i) => {
    if (i) s += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]);
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    const o = amp * (0.62 * Math.sin(s / f1 + a1) + 0.38 * Math.sin(s / f2 + a2));
    return [q[0] + nx * o, q[1] + ny * o];
  });
  const d = "M" + w.map(q => q[0].toFixed(0) + " " + q[1].toFixed(0)).join("L");
  pathCache.set(key, d);
  return d;
}

// Frame that fits every drawn line, kept at the print's 4:5.
export function frameFor(lines: Line[]) {
  let x0 = HOME.x, y0 = HOME.y, x1 = HOME.x + HOME.w, y1 = HOME.y + HOME.h;
  for (const l of lines) for (const [x, y] of GEO[l] ?? []) {
    x0 = Math.min(x0, x - 1200); y0 = Math.min(y0, y - 1200); x1 = Math.max(x1, x + 1200); y1 = Math.max(y1, y + 1200);
  }
  let w = x1 - x0, h = y1 - y0;
  if (w / h > 0.8) { const nh = w / 0.8; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * 0.8; x0 -= (nw - w) / 2; w = nw; }
  return { x: x0, y: y0, w, h };
}

export type Stroke = { line: Line; d: string; color: string; dx: number; dy: number };

// One thin stroke per line, in the order first ridden. Repeat rides show in the count, not the ink.
export function strokesFor(dayKey: string, lines: Line[]): Stroke[] {
  return [...new Set(lines)].map((line, i) => {
    const r = rng(hash(dayKey + line + i));
    return { line, d: handPath(line, line + ":" + i), color: paperInk(line), dx: (r() - 0.5) * 150, dy: (r() - 0.5) * 150 };
  });
}
export const strokeWidth = (frameW: number, base = 300) => base * Math.pow(frameW / HOME.w, 0.6);

// Small square mark of one line's route, for grids and rows.
export function markBox(line: Line, pad = 1.2) {
  const pts = GEO[line];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const s = Math.max(x1 - x0, y1 - y0, 2600) * pad;
  return { x: (x0 + x1) / 2 - s / 2, y: (y0 + y1) / 2 - s / 2, s };
}

