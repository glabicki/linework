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

export type Settings = { lines: Line[]; recaps: { weekly: boolean; monthly: boolean; yearly: boolean }; onboarded: boolean };

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
function save(next: State) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* keep going in memory */ }
  subs.forEach(f => f());
}
const subscribe = (f: () => void) => { load(); subs.add(f); return () => subs.delete(f); };
const getSnap = () => { load(); return state; };
const getServer = () => DEFAULT;

export const useStore = () => useSyncExternalStore(subscribe, getSnap, getServer);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function timing(line: Line, from?: string, to?: string) {
  const m = scheduledMin(line, from, to);
  return { min: m ?? typicalMin(line), est: m == null };
}

export function addRide(day: string, line: Line, extra: Partial<Pick<Ride, "from" | "to" | "time">> = {}) {
  const ride: Ride = { id: uid(), day, line, ...extra, ...timing(line, extra.from, extra.to), at: Date.now() };
  save({ ...state, rides: [...state.rides, ride] });
  return ride;
}
export function updateRide(id: string, patch: Partial<Pick<Ride, "from" | "to" | "time">>) {
  save({
    ...state,
    rides: state.rides.map(r => {
      if (r.id !== id) return r;
      const n = { ...r, ...patch };
      return { ...n, ...timing(n.line, n.from, n.to) };
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
export function seedDemo() {
  const t = todayKey();
  const extra = ["G", "6", "Q", "7", "F", "1", "N", "J", "M", "C"];
  const rides: Ride[] = [];
  for (let k = "2026-10-01"; k <= t; k = addDays(k, 1)) {
    const r = rng(hash("demo" + k));
    if (r() < 0.14) continue; // a day off the train
    const mix: Line[] = r() < 0.8 ? ["L", "A"] : [];
    if (r() < 0.45 || !mix.length) mix.push(extra[Math.floor(r() * extra.length)]);
    if (!mix.includes("L") && r() < 0.4) mix.push(extra[Math.floor(r() * extra.length)]);
    [...new Set(mix)].forEach((line, i) => rides.push({ id: uid(), day: k, line, ...timing(line), at: Date.parse(k) + i * 3.6e6 }));
  }
  save({ rides, settings: { ...state.settings, lines: ["L", "A", "G"], onboarded: true } });
}
