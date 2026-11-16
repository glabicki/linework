"use client";
import { useEffect, useState } from "react";

// The app inside an iPhone-sized frame (393 × 852, like the Figma screens).
export default function PhoneFrame({ children }: { children?: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const [src, setSrc] = useState("/?framed");
  useEffect(() => {
    // ?demo on the outer page reaches the app inside the frame
    if (new URLSearchParams(location.search).has("demo")) setSrc("/?framed&demo");
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / 892, (window.innerWidth - 32) / 433));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="phone-stage">
      {children}
      <div style={{ width: 433 * scale, height: 892 * scale, flex: "none" }}>
      <div style={{ width: 433, height: 892, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div style={{ width: 433, height: 892, borderRadius: 68, background: "#0a0a0a", padding: 20, boxShadow: "0 0 0 2px #3a3632, 0 30px 80px rgba(0,0,0,.6)" }}>
          <div style={{ position: "relative", width: 393, height: 852, borderRadius: 50, overflow: "hidden", background: "#000" }}>
            <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 32px 0 40px", color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "var(--font)" }}>
              <span>9:41</span>
              <svg width="62" height="12" viewBox="0 0 62 12" aria-hidden="true" fill="#fff">
                <rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="6" width="3" height="6" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" />
                <rect x="36" y="0.5" width="23" height="11" rx="3" fill="none" stroke="#fff" /><rect x="38" y="2.5" width="17" height="7" rx="1.5" /><rect x="60" y="4" width="1.5" height="4" rx="0.75" />
              </svg>
            </div>
            <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: 124, height: 36, borderRadius: 20, background: "#000", zIndex: 2 }} />
            <iframe src={src} title="Linework on a phone" style={{ display: "block", width: 393, height: 798, border: 0 }} />
            <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", width: 134, height: 5, borderRadius: 3, background: "#fff", pointerEvents: "none" }} />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
