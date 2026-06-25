import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import "./globals.css";

// Admin/control UI (Stitch "Obsidian" design)
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Broadcast overlay UI (scores.html design)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MatchPulse Live",
  description: "Broadcast-grade sports overlay control system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${montserrat.variable} h-full antialiased`}
    >
      <head>
        {/* Admin/control UI icons (Stitch design) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
