export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DOWL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dateOf = (k: string) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => keyOf(new Date());
export const addDays = (k: string, n: number) => { const d = dateOf(k); d.setDate(d.getDate() + n); return keyOf(d); };
export const isWeekend = (k: string) => { const g = dateOf(k).getDay(); return g === 0 || g === 6; };

export const dayShort = (k: string) => { const d = dateOf(k); return `${DOW[d.getDay()]} ${d.getDate()}`; };
export const dayLong = (k: string) => { const d = dateOf(k); return `${DOWL[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };
export const monthDay = (k: string) => { const d = dateOf(k); return `${MON[d.getMonth()]} ${d.getDate()}`; };

// Weeks start Monday.
export const weekStart = (k: string) => { const d = dateOf(k); const g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g); return keyOf(d); };

export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
export const fmtH = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}`);

export function to12(v?: string) {
  if (!v) return "";
  const [h0, m] = v.split(":").map(Number);
  const ap = h0 < 12 ? "am" : "pm", h = h0 % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
