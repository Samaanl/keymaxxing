import { Press_Start_2P, VT323 } from "next/font/google";

// Self-hosted at build time (offline-safe, no external request, no FOUT).
export const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const termFont = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-term",
  display: "swap",
});
