import { addDays, isWeekend } from "./dates";
import type { Line } from "./lines";
import type { Ride } from "./rides";

// Your usual rides, learned from the ones you gave stations for. Nothing here leaves the phone.

export type Stretch = { from: string; to: string };
const SEP = "\u0000";
const WINDOW = 90; // days of history that count; a new commute takes over within a few weeks

// When a ride happened, in minutes after midnight: its time if you set one, otherwise when you logged it.
export const minuteOf = (r: Ride) => {
  if (r.time) { const [h, m] = r.time.split(":").map(Number); return h * 60 + m; }
  const d = new Date(r.at);
  return d.getHours() * 60 + d.getMinutes();
};

const withStations = (rides: Ride[], day: string) =>
  rides.filter(r => r.from && r.to && r.from !== r.to && r.day <= day && r.day > addDays(day, -WINDOW));

function mostCommon<T>(items: T[], key: (t: T) => string) {
  const c = new Map<string, { n: number; last: T }>();
  for (const t of items) { const k = key(t), e = c.get(k); c.set(k, { n: (e?.n ?? 0) + 1, last: t }); }
  return [...c.entries()].sort((a, b) => b[1].n - a[1].n)[0];
}

// The stretch a quick tap on a line should log: the one you ride most on it (at least twice).
// Later the same day it's the way back; otherwise the way you usually go at this time of day.
export function usualStretch(line: Line, rides: Ride[], day: string, minute: number): Stretch | undefined {
  const known = withStations(rides, day).filter(r => r.line === line);
  const top = mostCommon(known, r => [r.from, r.to].sort().join(SEP));
  if (!top || top[1].n < 2) return undefined;
  const pair = known.filter(r => [r.from, r.to].sort().join(SEP) === top[0]);
  const earlier = pair.filter(r => r.day === day).sort((a, b) => b.at - a.at)[0];
  if (earlier) return { from: earlier.to!, to: earlier.from! };
  const am = minute < 12 * 60;
  const dir = mostCommon(pair.filter(r => (minuteOf(r) < 12 * 60) === am), r => r.from + SEP + r.to) ?? mostCommon(pair, r => r.from + SEP + r.to)!;
  const [from, to] = dir[0].split(SEP);
  return { from, to };
}

// The ride you usually take around now: same line, stations and direction on at least three
// different days in the last eight weeks, within an hour and a half of this time, on weekdays
// or weekends to match today. Gone once you've logged it today.
export function usualRide(rides: Ride[], day: string, minute: number): ({ line: Line } & Stretch) | undefined {
  const weekend = isWeekend(day);
  const near = withStations(rides, day).filter(r => r.day < day && r.day >= addDays(day, -56) && isWeekend(r.day) === weekend && Math.abs(minuteOf(r) - minute) <= 90);
  const days = new Map<string, Set<string>>();
  for (const r of near) { const k = [r.line, r.from, r.to].join(SEP); days.set(k, (days.get(k) ?? new Set()).add(r.day)); }
  const best = [...days.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  if (!best || best[1].size < 3) return undefined;
  const [line, from, to] = best[0].split(SEP);
  if (rides.some(r => r.day === day && r.line === line && r.from === from && r.to === to)) return undefined;
  return { line, from, to };
}
