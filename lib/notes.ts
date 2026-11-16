import { NAME, type Line } from "./lines";
import { minutes, type Ride } from "./rides";

// A day's caption: your own words when you wrote some, otherwise a quiet fact the rides already tell.
export function captionFor(day: string, rides: Ride[], notes: Record<string, string> = {}) {
  const own = notes[day]?.trim();
  return own || factFor(day, rides);
}

const plain = (l: Line) => NAME[l] ?? l;
const nth = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");

// Facts, not feelings: a first print, a first line, a round number, a record. Nothing on an ordinary day.
export function factFor(day: string, rides: Ride[]) {
  const today = rides.filter(r => r.day === day);
  if (!today.length) return undefined;
  const before = rides.filter(r => r.day < day);
  if (!before.length) return "Your first print";

  const seen = new Set(before.map(r => r.line));
  const fresh = [...new Set(today.map(r => r.line))].filter(l => !seen.has(l)) as Line[];
  if (fresh.length === 1) return `First time on the ${plain(fresh[0])}`;
  if (fresh.length === 2) return `First time on the ${plain(fresh[0])} and ${plain(fresh[1])}`;
  if (fresh.length > 2) return `${fresh.length} new lines in one day`;

  const byDay = new Map<string, Ride[]>();
  before.forEach(r => byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]));
  const n = byDay.size + 1;
  if (n === 10 || n === 25 || n % 50 === 0) return `Your ${nth(n)} print`;

  const days = [...byDay.values()];
  if (today.length >= 4 && today.length > Math.max(...days.map(d => d.length))) return "Most rides in a day yet";
  const m = minutes(today);
  if (m >= 90 && m > Math.max(...days.map(minutes))) return "Longest day underground yet";
  return undefined;
}

// The year in your own words: a few captions spread across it, oldest first.
export function yourWords(notes: Record<string, string>, year: number, n = 4) {
  const days = Object.keys(notes).filter(k => k.startsWith(String(year)) && notes[k].trim()).sort();
  if (days.length <= n) return days.map(day => ({ day, text: notes[day].trim() }));
  return [...Array(n)].map((_, i) => days[Math.round((i * (days.length - 1)) / (n - 1))]).map(day => ({ day, text: notes[day].trim() }));
}
