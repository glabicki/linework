"use client";
import { useSyncExternalStore } from "react";
import { scheduledMin, typicalMin, type Line } from "./lines";
import { addDays, todayKey } from "./dates";
import { hash, rng } from "./art";

export type Ride = {
  id: string;
  day: string; // YYYY-MM-DD, local
  line: Line;
  from?: string;
  to?: string;
  time?: string; // HH:MM, 24h
  min: number;
  est: boolean; // true when min is a typical ride, not scheduled
  at: number; // when it was logged
};

export type Settings = {
  lines: Line[];
  recaps: { weekly: boolean; monthly: boolean; yearly: boolean };
  onboarded: boolean;
  backedUp?: string; // day of the last saved backup file
  seen?: string[]; // recap cards already closed on Today
};

type State = { rides: Ride[]; settings: Settings };

const KEY = "linework.v1";
const DEFAULT: State = { rides: [], settings: { lines: [], recaps: { weekly: true, monthly: true, yearly: true }, onboarded: false } };

let state: State = DEFAULT;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* private mode or blocked storage: run in memory */ }
}
let persisted = false;
function save(next: State) {
  state = next;
  // Ask the browser not to clear our storage once there's something worth keeping.
  if (!persisted && state.rides.length) { persisted = true; navigator.storage?.persist?.().catch(() => {}); }
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* keep going in memory */ }
  subs.forEach(f => f());
}
const subscribe = (f: () => void) => { load(); subs.add(f); return () => subs.delete(f); };
const getSnap = () => { load(); return state; };
const getServer = () => DEFAULT;

export const useStore = () => useSyncExternalStore(subscribe, getSnap, getServer);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Scheduled time between stations; otherwise your own usual time on this line
// (from rides where you gave stations); otherwise a typical ride.
export function timing(line: Line, from?: string, to?: string, history: Ride[] = []) {
  const m = scheduledMin(line, from, to);
  if (m != null) return { min: m, est: false };
  return { min: usualMin(line, history) ?? typicalMin(line), est: true };
}
export function usualMin(line: Line, history: Ride[]) {
  const known = history.filter(r => r.line === line && !r.est).map(r => r.min).sort((a, b) => a - b);
  if (known.length < 2) return undefined;
  return known[Math.floor(known.length / 2)];
}

export function addRide(day: string, line: Line, extra: Partial<Pick<Ride, "from" | "to" | "time">> = {}) {
  const ride: Ride = { id: uid(), day, line, ...extra, ...timing(line, extra.from, extra.to, state.rides), at: Date.now() };
  save({ ...state, rides: [...state.rides, ride] });
  return ride;
}
export function updateRide(id: string, patch: Partial<Pick<Ride, "from" | "to" | "time">>) {
  save({
    ...state,
    rides: state.rides.map(r => {
      if (r.id !== id) return r;
      const n = { ...r, ...patch };
      return { ...n, ...timing(n.line, n.from, n.to, state.rides) };
    }),
  });
}
export function removeRide(id: string) {
  const r = state.rides.find(x => x.id === id);
  save({ ...state, rides: state.rides.filter(x => x.id !== id) });
  return r;
}
export function restoreRide(r: Ride) {
  save({ ...state, rides: [...state.rides, r].sort((a, b) => a.at - b.at) });
}
export function setSettings(patch: Partial<Settings>) {
  save({ ...state, settings: { ...state.settings, ...patch } });
}
export function eraseAll() {
  save({ ...DEFAULT, settings: { ...DEFAULT.settings, onboarded: true } });
}

// Backup file: everything on this phone, as JSON. Restoring merges by ride id.
export function backupJSON(s: { rides: Ride[]; settings: Settings }) {
  return JSON.stringify({ app: "linework", version: 1, saved: new Date().toISOString(), rides: s.rides, settings: s.settings }, null, 1);
}
export function parseBackup(text: string): { rides: Ride[]; settings?: Settings } {
  const j = JSON.parse(text);
  if (!j || j.app !== "linework" || !Array.isArray(j.rides)) throw new Error("not a Linework backup");
  const ok = (r: Ride) => r && typeof r.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && typeof r.line === "string" && typeof r.min === "number";
  return { rides: j.rides.filter(ok), settings: j.settings };
}
export function mergeRides(mine: Ride[], theirs: Ride[]) {
  const ids = new Set(mine.map(r => r.id));
  return [...mine, ...theirs.filter(r => !ids.has(r.id))].sort((a, b) => a.at - b.at);
}
export function restoreBackup(text: string) {
  const b = parseBackup(text);
  const rides = mergeRides(state.rides, b.rides);
  const added = rides.length - state.rides.length;
  const lines = state.settings.lines.length ? state.settings.lines : b.settings?.lines ?? [];
  save({ rides, settings: { ...state.settings, lines, onboarded: true } });
  return added;
}
export function markBackedUp(day: string) { setSettings({ backedUp: day }); }
export function markSeen(id: string) { setSettings({ seen: [...(state.settings.seen ?? []), id].slice(-24) }); }

export const ridesOn = (rides: Ride[], day: string) => rides.filter(r => r.day === day);
export const minutes = (rides: Ride[]) => rides.reduce((a, r) => a + r.min, 0);
export const linesOf = (rides: Ride[]) => [...new Set(rides.map(r => r.line))];

export function toCSV(rides: Ride[]) {
  const q = (s?: string) => (s ? `"${s.replace(/"/g, '""')}"` : "");
  const rows = [...rides].sort((a, b) => a.day.localeCompare(b.day) || a.at - b.at)
    .map(r => [r.day, r.time ?? "", r.line, q(r.from), q(r.to), r.min, r.est ? "about" : "scheduled"].join(","));
  return ["date,time,line,from,to,minutes,timing", ...rows].join("\n");
}

// Sample rides for trying the app: ?demo in the URL fills Oct 1 to today.
// On the live site it only fills an empty phone, so a shared ?demo link can never replace real rides.
export function seedDemo() {
  load();
  if (process.env.NODE_ENV === "production" && state.rides.length) return;
  const t = todayKey();
  const extra = ["G", "6", "Q", "7", "F", "1", "N", "J", "M", "C"];
  const rides: Ride[] = [];
  for (let k = "2026-10-01"; k < t; k = addDays(k, 1)) {
    const r = rng(hash("demo" + k));
    if (r() < 0.14) continue; // a day off the train
    const mix: Line[] = r() < 0.8 ? ["L", "A"] : [];
    if (r() < 0.45 || !mix.length) mix.push(extra[Math.floor(r() * extra.length)]);
    if (!mix.includes("L") && r() < 0.4) mix.push(extra[Math.floor(r() * extra.length)]);
    [...new Set(mix)].forEach((line, i) => rides.push({ id: uid(), day: k, line, ...timing(line), at: Date.parse(k) + i * 3.6e6 }));
  }
  // today matches the Figma Today screen
  ([["L", "Bedford Av", "8 Av", "08:41"], ["A", "14 St", "Jay St-MetroTech", "12:10"], ["A", "Jay St-MetroTech", "14 St", "18:15"]] as [Line, string, string, string][])
    .forEach(([line, from, to, time], i) => rides.push({ id: uid(), day: t, line, from, to, time, ...timing(line, from, to), at: Date.parse(t) + i * 3.6e6 }));
  save({ rides, settings: { ...state.settings, lines: ["L", "A", "G"], onboarded: true } });
}
