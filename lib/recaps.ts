import { MON, MONL, addDays, dateOf, fmtH, keyOf, plural, weekStart } from "./dates";
import { linesOf, minutes, type Ride, type Settings } from "./rides";

// Recaps show up as a card at the top of Today; no push notifications.
export type RecapCard = {
  id: string;
  kind: "week" | "month" | "year";
  kicker: string;
  title: string;
  body: string;
  start?: string; // week start, for sharing the week
  year?: number;
};

const summary = (list: Ride[]) => `${plural(list.length, "ride")} on ${plural(linesOf(list).length, "line")}`;

export function dueCards(now: Date, rides: Ride[], settings: Settings): RecapCard[] {
  const today = keyOf(now);
  const seen = new Set(settings.seen ?? []);
  const out: RecapCard[] = [];
  const t = dateOf(today);

  if (settings.recaps.yearly && t.getMonth() === 0 && t.getDate() <= 14) {
    const y = t.getFullYear() - 1;
    const list = rides.filter(r => r.day.startsWith(String(y)));
    const days = new Set(list.map(r => r.day)).size;
    if (days) out.push({ id: `year-${y}`, kind: "year", kicker: `${y}, Drawn.`, title: `${plural(days, "print")}`, body: `${fmtH(minutes(list))} underground across ${y}.`, year: y });
  }

  if (settings.recaps.monthly && t.getDate() <= 7) {
    const p = new Date(t.getFullYear(), t.getMonth() - 1, 1);
    const prefix = keyOf(p).slice(0, 7);
    const list = rides.filter(r => r.day.startsWith(prefix));
    if (list.length) out.push({ id: `month-${prefix}`, kind: "month", kicker: "Monthly recap", title: `${MONL[p.getMonth()]}: ${fmtH(minutes(list))} underground`, body: summary(list) });
  }

  if (settings.recaps.weekly) {
    // This week's recap is ready Sunday at 7 pm; until then, last week's.
    const ws = weekStart(today);
    const start = t.getDay() === 0 && now.getHours() >= 19 ? ws : addDays(ws, -7);
    const end = addDays(start, 6);
    const list = rides.filter(r => r.day >= start && r.day <= end);
    const range = weekRange(start);
    if (list.length) out.push({ id: `week-${start}`, kind: "week", kicker: "Weekly recap", title: `${fmtH(minutes(list))} underground`, body: `${range} · ${summary(list)}`, start });
  }

  return out.filter(c => !seen.has(c.id));
}

// Time to save a backup: after ten rides, with none in 30 days. Shown in Account, not over the print.
export function backupDue(now: Date, rides: Ride[], settings: Settings) {
  const stale = !settings.backedUp || (now.getTime() - dateOf(settings.backedUp).getTime()) / 864e5 > 30;
  return rides.length >= 10 && stale;
}

// Columns for the year-so-far grid: the fewest (biggest prints) that fit.
export function yearCols(cells: number, width = 345, height = 470, gap = 4) {
  for (let c = 3; c <= 18; c++) {
    const w = (width - (c - 1) * gap) / c;
    if (Math.ceil(cells / c) * (w * 132 / 108 + gap) <= height) return c;
  }
  return 18;
}

export function weekRange(start: string) {
  const s = dateOf(start), e = dateOf(addDays(start, 6));
  return s.getMonth() === e.getMonth() ? `${MON[s.getMonth()]} ${s.getDate()} – ${e.getDate()}` : `${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`;
}

// Days in a row with at least one ride. Current counts back from today, or from yesterday
// while today has none yet, so a streak doesn't vanish at breakfast.
export function currentStreak(rides: Ride[], today: string) {
  const days = new Set(rides.map(r => r.day));
  let d = days.has(today) ? today : addDays(today, -1), n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
export function longestStreak(rides: Ride[]) {
  const days = [...new Set(rides.map(r => r.day))].sort();
  let best = { n: 0, start: "", end: "" }, run = 0, start = "";
  days.forEach((d, i) => {
    run = i && addDays(days[i - 1], 1) === d ? run + 1 : 1;
    if (run === 1) start = d;
    if (run > best.n) best = { n: run, start, end: d };
  });
  return best;
}

// Everything the 2026, Drawn. story shows.
export function yearStory(rides: Ride[], y: number) {
  const list = rides.filter(r => r.day.startsWith(String(y)));
  const byLine = new Map<Ride["line"], number>();
  const byDay = new Map<string, number>();
  list.forEach(r => { byLine.set(r.line, (byLine.get(r.line) ?? 0) + 1); byDay.set(r.day, (byDay.get(r.day) ?? 0) + 1); });
  const lines = [...byLine.entries()].sort((a, b) => b[1] - a[1]);
  let busiest = { day: "", n: 0 };
  for (const [day, n] of byDay) if (n > busiest.n || (n === busiest.n && day < busiest.day)) busiest = { day, n };
  return { rides: list, min: minutes(list), prints: byDay.size, lines, busiest, streak: longestStreak(list) };
}
