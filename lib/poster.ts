import { frameFor, strokesFor, strokeWidth, type Leg } from "./art";
import { paperInk } from "./lines";
import { DOWL, MONL, dateOf, plural } from "./dates";

// 2 × 3 is the mini, wallet-sized, for a shelf or a row of them on a wall.
export const SIZES: [number, number][] = [[2, 3], [5, 7], [8, 10], [11, 14], [18, 24]];
export const PAPERS = { white: "#FFFFFF", warm: "#F4EFE6" } as const;
export type Paper = keyof typeof PAPERS;
const FONT = "'Helvetica Neue', Helvetica, Arimo, Arial, sans-serif", INK = "#2A2724", SOFT = "#6F6A64";

// The file itself: the drawing, its inks and its date. No app chrome, no logo.
// `day` seeds the wobble; a year poster passes its year there and as the title.
export function posterSvg(o: { day: string; legs: Leg[]; rides: number; size: [number, number]; paper: Paper; caption: boolean; title?: string; flat?: boolean }) {
  const [iw, ih] = o.size, W = 1000, H = Math.round((W * ih) / iw), m = 72, bg = PAPERS[o.paper];
  // The mini's caption is set larger so it still reads at 2 inches wide.
  const k = iw < 4 ? 1.6 : 1, cap = o.caption ? Math.round(150 * k) : 0;
  const strokes = strokesFor(o.day, o.legs), lines = o.legs.map(l => l.line);
  const f = frameFor(strokes), sw = strokeWidth(f.w, 300);
  const art = strokes.map(s =>
    `<path d="${s.d}" transform="translate(${s.dx.toFixed(0)} ${s.dy.toFixed(0)})" fill="none" stroke="${s.color}" stroke-width="${sw.toFixed(0)}" stroke-linecap="round" stroke-linejoin="round" ${o.flat ? 'opacity="0.9"' : 'style="mix-blend-mode:multiply"'}/>`).join("");
  let body = `<svg x="${m}" y="${m}" width="${W - 2 * m}" height="${H - 2 * m - cap}" viewBox="${f.x.toFixed(0)} ${f.y.toFixed(0)} ${f.w.toFixed(0)} ${f.h.toFixed(0)}" preserveAspectRatio="xMidYMid meet" overflow="visible">${art}</svg>`;
  if (o.caption) {
    const y = H - m - cap + 44 * k, d = o.title ? null : dateOf(o.day);
    const title = d ? `${DOWL[d.getDay()]}, ${MONL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : o.title;
    const sub = `${plural(new Set(lines).size, "line")} · ${plural(o.rides, "ride")}`;
    const inks = [...new Set(lines.map(paperInk))];
    const dots = inkRow(inks.length, W - 2 * m, title!.length * 34 * k * 0.6, sub.length * 25 * k * 0.55, k);
    body += `<rect x="${m}" y="${y}" width="${W - 2 * m}" height="${3.5 * k}" fill="${INK}"/>`;
    body += `<text x="${m}" y="${y + 62 * k}" font-family="${FONT}" font-weight="700" font-size="${34 * k}" fill="${INK}">${title}</text>`;
    // On the mini the dots are part of the line count's text, so they follow the words wherever they end.
    const mini = k > 1, fs = (2 * dots.r) / DOT, inline = mini
      ? `<tspan dx="${(16 * k).toFixed(1)}" font-size="${fs.toFixed(1)}" letter-spacing="${(dots.step - fs * DOT_ADV).toFixed(1)}">${inks.map(c => `<tspan fill="${c}">●</tspan>`).join("")}</tspan>` : "";
    body += `<text x="${m}" y="${y + 100 * k}" font-family="${FONT}" font-size="${25 * k}" fill="${SOFT}">${sub}${inline}</text>`;
    if (!mini) {
      const cy = y + (dots.row === "title" ? 52 : 91) * k, x0 = W - m - dots.width;
      body += inks.map((c, i) => `<circle cx="${(x0 + dots.r + i * dots.step).toFixed(1)}" cy="${cy.toFixed(1)}" r="${dots.r.toFixed(1)}" fill="${c}"/>`).join("");
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;
}

// The ● glyph: its circle is about this share of the font size across, and its advance this share.
const DOT = 0.46, DOT_ADV = 0.6;

// Where the ink dots go in the caption: beside the date when they fit, otherwise beside the
// smaller line count, drawn closer together (and smaller if they must) so they never touch the words.
// On the mini print they always sit right after the line count, sized to its letters.
export function inkRow(n: number, width: number, titleW: number, subW: number, k = 1) {
  const mini = k > 1;
  let r = (mini ? 7 : 11) * k, step = r * (mini ? 2.5 : 2.7);
  const gap = 28 * k, span = (st: number, rr: number) => (n - 1) * st + 2 * rr;
  if (!mini && titleW + gap + span(step, r) <= width) return { row: "title" as const, r, step, width: span(step, r) };
  const room = width - subW - gap;
  if (n > 1) step = Math.min(step, (room - 2 * r) / (n - 1));
  if (step < r * 2.3) { r = Math.max(4 * k, room / (n * 2.3 + 0.3)); step = r * 2.3; }
  return { row: "sub" as const, r, step, width: span(step, r) };
}

// PNG at print resolution, drawn from the SVG: 300 dpi up to 8 × 10 so small prints stay sharp,
// 150 dpi above that to keep the image within what a phone can draw.
export const dpiFor = (size: [number, number]) => (size[0] <= 8 ? 300 : 150);
export async function posterPng(svg: string, size: [number, number]) {
  const dpi = dpiFor(size), px = Math.round(size[0] * dpi), py = Math.round(size[1] * dpi);
  const img = new Image();
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  await img.decode();
  const c = document.createElement("canvas"); c.width = px; c.height = py;
  c.getContext("2d")!.drawImage(img, 0, 0, px, py);
  return new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("png"))), "image/png"));
}

// Save a PNG: the share sheet on a phone (Save Image puts it in Photos), a download elsewhere.
export async function savePoster(svg: string, size: [number, number], name: string, toast: (m: string) => void) {
  try {
    const blob = await posterPng(svg, size);
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("Saved");
  } catch (e) {
    if ((e as Error).name !== "AbortError") toast("Couldn’t save. Try again.");
  }
}
