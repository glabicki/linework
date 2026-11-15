"use client";
import { markSeen, type Ride } from "@/lib/rides";
import { shareWeek } from "@/lib/share";
import type { RecapCard as Card } from "@/lib/recaps";
import { Icon } from "./icons";
import type { Nav } from "./App";

// A recap waiting at the top of Today. × puts it away for good.
export default function RecapCard({ card, rides, nav, toast }: { card: Card; rides: Ride[]; nav: Nav; toast: (m: string) => void }) {
  const act = async () => {
    if (card.kind === "week" && card.start) {
      try { if ((await shareWeek(card.start, rides)) === "saved") toast("Saved the week as an image"); }
      catch (e) { if ((e as Error).name !== "AbortError") toast("Couldn’t make the image. Try again."); }
      return;
    }
    markSeen(card.id);
    if (card.kind === "month") nav.tab("recaps");
    else if (card.kind === "year") nav.push({ kind: "year", year: card.year });
    else nav.push({ kind: "account" });
  };
  const verb = { week: "Share the week", month: "See your recaps", year: "See it", backup: "Save a backup" }[card.kind];
  return (
    <section className="recap-card" aria-label={card.kicker}>
      <div className="rc-top">
        <p className="kicker">{card.kicker}</p>
        <button type="button" className="rc-x" aria-label={`Close ${card.kicker.toLowerCase()}`} onClick={() => markSeen(card.id)}><Icon name="close" size={18} /></button>
      </div>
      <h2>{card.title}</h2>
      <p className="rc-body">{card.body}</p>
      <button type="button" className="rc-act" onClick={act}>{verb} ›</button>
    </section>
  );
}
