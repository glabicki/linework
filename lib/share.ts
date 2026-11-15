// Figma 39:508 Export / Week · ink: a 432 × 540 image of one week of prints.
import { frameFor, strokeWidth, strokesFor } from "./art";
import { paperInk } from "./lines";
import { MON, addDays, dateOf, dayShort, plural } from "./dates";
import { posterPng } from "./poster";
import type { Ride } from "./rides";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// Hand-placed like the Figma frame: four on top, three below, each a touch off level.
const SLOTS: [number, number][] = [[26, 197], [126, 195], [221, 196], [320, 195], [75, 335], [174, 333], [268, 335]];

function card(day: string, rides: Ride[], x: number, y: number) {
  const W = 86, H = 112;
  if (!rides.length) return `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="none" stroke="#3a3632"/>`;
  const lines = rides.map(r => r.line);
  const f = frameFor(lines), sw = strokeWidth(f.w, 300);
  const paths = strokesFor(day, lines).map(s => `<path d="${s.d}" transform="translate(${s.dx.toFixed(0)} ${s.dy.toFixed(0)})" fill="none" stroke="${s.color}" stroke-width="${sw.toFixed(0)}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const inks = [...new Set(lines.map(paperInk))];
  const dots = inks.map((c, i) => `<circle cx="${x + 69 - (inks.length - 1 - i) * 3}" cy="${y + 101}" r="1" fill="${c}"/>`).join("");
  return `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#fff"/>`
    + `<svg x="${x + 5}" y="${y + 5}" width="76" height="95" viewBox="${f.x.toFixed(0)} ${f.y.toFixed(0)} ${f.w.toFixed(0)} ${f.h.toFixed(0)}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`
    + `<text x="${x + 5}" y="${y + 103}" font-size="3.2" font-weight="700" fill="#2a2724">${dayShort(day)}</text>${dots}`
    + `<text x="${x + 81}" y="${y + 103}" font-size="2.7" fill="#6f6a64" text-anchor="end">${plural(rides.length, "ride")}</text>`;
}

export function weekSvg(start: string, rides: Ride[]) {
  const keys = [...Array(7)].map((_, i) => addDays(start, i));
  const week = rides.filter(r => r.day >= keys[0] && r.day <= keys[6]);
  const a = dateOf(keys[0]), b = dateOf(keys[6]);
  const range = `${MON[a.getMonth()]} ${a.getDate()} – ${a.getMonth() === b.getMonth() ? "" : MON[b.getMonth()] + " "}${b.getDate()}`;
  const min = week.reduce((s, r) => s + r.min, 0);
  const big = min < 60 ? String(min) : String(Math.round(min / 60));
  const unit = min < 60 ? "minutes" : "hours";
  const nLines = new Set(week.map(r => r.line)).size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="432" height="540" viewBox="0 0 432 540" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">`
    + `<rect width="432" height="540" fill="#000"/>`
    + `<text x="28" y="41" font-size="11" font-weight="700" fill="#fff" letter-spacing="0.1">${esc(range.toUpperCase())}</text>`
    + `<text x="22" y="132" font-size="112" font-weight="700" fill="#fff" letter-spacing="-1">${big}</text>`
    + `<text x="${30 + big.length * 62}" y="95" font-size="26" font-weight="700" fill="#fff" letter-spacing="-0.3">${unit}</text>`
    + `<text x="${30 + big.length * 62}" y="121" font-size="26" font-weight="700" fill="#fff" letter-spacing="-0.3">underground</text>`
    + `<text x="${32 + big.length * 62}" y="148" font-size="13" fill="#fff">${plural(week.length, "ride")} on ${plural(nLines, "line")}</text>`
    + keys.map((k, i) => card(k, week.filter(r => r.day === k), ...SLOTS[i])).join("")
    + `<text x="28" y="514" font-size="13" fill="#fff">one print a day</text></svg>`;
}

export async function shareWeek(start: string, rides: Ride[]) {
  const blob = await posterPng(weekSvg(start, rides), [432 * 2.5 / 150, 540 * 2.5 / 150]);
  const file = new File([blob], `linework-week-${start}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return "shared"; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return "saved";
}
