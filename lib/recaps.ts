import { MON, MONL, addDays, dateOf, fmtH, keyOf, plural, weekStart } from "./dates";
import { linesOf, minutes, type Ride, type Settings } from "./rides";

// Recaps show up as a card at the top of Today; no push notifications.
export type RecapCard = {
  id: string;
  kind: "week" | "month" | "year" | "backup";
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
    const s = dateOf(start), e = dateOf(end);
    const range = s.getMonth() === e.getMonth() ? `${MON[s.getMonth()]} ${s.getDate()} – ${e.getDate()}` : `${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`;
    if (list.length) out.push({ id: `week-${start}`, kind: "week", kicker: "Weekly recap", title: `${fmtH(minutes(list))} underground`, body: `${range} · ${summary(list)}`, start });
  }

  // A nudge to save a backup: once a month, after ten rides, if none in 30 days.
  const stale = !settings.backedUp || (now.getTime() - dateOf(settings.backedUp).getTime()) / 864e5 > 30;
  if (rides.length >= 10 && stale) {
    out.push({ id: `backup-${today.slice(0, 7)}`, kind: "backup", kicker: "Backup", title: "Save a copy of your rides", body: "They live only on this phone. A backup file brings them back if it’s ever cleared." });
  }

  return out.filter(c => !seen.has(c.id));
}

// Columns for the year-so-far grid: the fewest (biggest prints) that fit.
export function yearCols(cells: number, width = 345, height = 470, gap = 4) {
  for (let c = 3; c <= 18; c++) {
    const w = (width - (c - 1) * gap) / c;
    if (Math.ceil(cells / c) * (w * 132 / 108 + gap) <= height) return c;
  }
  return 18;
}
