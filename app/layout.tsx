import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Merit Wears — Luxury Fashion",
  description:
    "Merit Wears: Navy & Silver luxury kaftans, footwear, and watches. The art of discipline in modern tailoring."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-surface-container-lowest text-primary">{children}</body>
    </html>
  );
}
