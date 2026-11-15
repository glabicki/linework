import type { Metadata, Viewport } from "next";
import RegisterSW from "@/components/RegisterSW";
import { Arimo } from "next/font/google";
import "./globals.css";

// Helvetica where the phone has it; Arimo (same metrics) everywhere else.
const arimo = Arimo({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-arimo" });

export const metadata: Metadata = {
  title: "Linework",
  description: "Every ride, drawn. Log your subway rides and each day becomes a print.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Linework", statusBarStyle: "black" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={arimo.variable}>
      <body>{children}<RegisterSW /></body>
    </html>
  );
}
