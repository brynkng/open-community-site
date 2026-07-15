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
import { siteUrl, absoluteUrl, OG_IMAGE_DEFAULT } from "@/lib/seo";
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

const SITE_NAME = "Sidewalk Story";
const SITE_DESCRIPTION =
  "Saturday dinners, Sunday rides, and everything in between.";

export async function generateMetadata(): Promise<Metadata> {
  const defaultImage = absoluteUrl(OG_IMAGE_DEFAULT);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    manifest: "/manifest.webmanifest",
    applicationName: SITE_NAME,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: SITE_NAME,
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
    openGraph: {
      type: "website",
      url: siteUrl(),
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [{ url: defaultImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [defaultImage],
    },
  };
}

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
