"use client";
import { markSeen } from "@/lib/rides";
import type { RecapCard as Card } from "@/lib/recaps";
import { Icon } from "./icons";
import type { Nav } from "./App";

// A recap waiting at the top of Today. × puts it away for good.
export default function RecapCard({ card, nav }: { card: Card; nav: Nav }) {
  const act = () => {
    markSeen(card.id);
    if (card.kind === "week") nav.tab("prints", card.start);
    else if (card.kind === "month") nav.tab("recaps");
    else if (card.kind === "year") nav.push({ kind: "year", year: card.year });
    else nav.push({ kind: "account" });
  };
  const verb = { week: "See your prints", month: "See your recaps", year: "See it", backup: "Save a backup" }[card.kind];
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
