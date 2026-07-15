import type { Metadata, Viewport } from "next";
import {
  Alfa_Slab_One,
  Archivo,
  Bricolage_Grotesque,
  Karla,
} from "next/font/google";
import "./globals.css";
import { getActivePrograms } from "@/lib/programs";
import type { Program } from "@/db/schema";
import { BrandNav } from "@/components/BrandNav";
import { SectionFooter } from "@/components/SectionFooter";

// Four brand fonts (KTD2): self-hosted via next/font/google, exposed as CSS
// vars consumed by globals.css (`--brand-font`) and components that need a
// specific brand's display face directly.
const fontSS = Alfa_Slab_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ss",
  display: "swap",
});
const fontNB = Archivo({
  subsets: ["latin"],
  variable: "--font-nb",
  display: "swap",
});
const fontFT = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-ft",
  display: "swap",
});
const fontBody = Karla({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sidewalk Story",
  description: "Saturday dinners, Sunday rides, and everything in between.",
  manifest: "/manifest.webmanifest",
  applicationName: "Sidewalk Story",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sidewalk Story",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  // Allow zoom for accessibility; 16px inputs already prevent iOS auto-zoom.
  maximumScale: 5,
  viewportFit: "cover",
};

async function safePrograms(): Promise<Program[]> {
  try {
    return await getActivePrograms();
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const programs = await safePrograms();
  return (
    <html
      lang="en"
      className={`${fontSS.variable} ${fontNB.variable} ${fontFT.variable} ${fontBody.variable}`}
    >
      <body>
        <BrandNav programs={programs} />
        {/*
          Keep the existing constrained container so admin/dinner/rides/trips
          pages (unmodified by this slice) don't shift; the landing rebuild
          breaks out of it per-panel with a full-bleed technique instead of
          removing the container here.
        */}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
        <SectionFooter />
      </body>
    </html>
  );
}
