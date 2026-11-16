"use client";
import { useEffect, useState } from "react";
import App from "@/components/App";
import PhoneFrame from "@/components/PhoneFrame";

// Linework is a phone app. On a computer it stays in a phone frame, with a note.
export default function Home() {
  const [desk, setDesk] = useState<boolean | null>(null);
  useEffect(() => {
    const framed = window.self !== window.top || new URLSearchParams(location.search).has("framed");
    // A computer (mouse or trackpad) at any window size, or a tablet-sized screen, gets the frame.
    // Phones never do, upright or sideways.
    const mq = matchMedia("(hover: hover) and (pointer: fine), (min-width: 600px) and (min-height: 600px)");
    const set = () => setDesk(!framed && mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  if (desk === null) return null;
  if (!desk) return <App />;
  return (
    <PhoneFrame>
      <aside className="desk-note">
        <h2>Linework is made for your phone.</h2>
        <p>Open this page on your iPhone, then add it to your Home Screen. You can try it here in the meantime.</p>
        <p className="credit">© 2026 Ashley Glabicki</p>
      </aside>
    </PhoneFrame>
  );
}
