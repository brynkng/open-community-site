import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getActivePrograms } from "@/lib/programs";
import type { Program } from "@/db/schema";

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

function programHref(p: Program): string {
  if (p.kind === "dinner") return `/dinner?program=${p.slug}`;
  if (p.kind === "ride") return `/rides?program=${p.slug}`;
  return `/trips?program=${p.slug}`;
}

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
    <html lang="en">
      <body>
        <header
          className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <nav className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <Link
              href="/"
              className="shrink-0 text-base font-bold text-brand sm:text-lg"
            >
              Sidewalk Story
            </Link>
            <div className="no-scrollbar flex flex-1 items-center gap-4 overflow-x-auto text-sm font-medium text-stone-700">
              {programs.length > 0 ? (
                programs.map((p) => (
                  <Link
                    key={p.id}
                    href={programHref(p)}
                    className="shrink-0 whitespace-nowrap hover:opacity-70"
                    style={{ color: p.accentColor }}
                  >
                    {p.name}
                  </Link>
                ))
              ) : (
                <>
                  <Link
                    href="/dinner"
                    className="shrink-0 whitespace-nowrap hover:text-brand"
                  >
                    Saturday Dinner
                  </Link>
                  <Link
                    href="/rides"
                    className="shrink-0 whitespace-nowrap hover:text-brand"
                  >
                    Sunday Rides
                  </Link>
                  <Link
                    href="/trips"
                    className="shrink-0 whitespace-nowrap hover:text-brand"
                  >
                    Trips
                  </Link>
                </>
              )}
              <Link
                href="/#newsletter"
                className="shrink-0 whitespace-nowrap hover:text-brand"
              >
                Newsletter
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-10 text-center text-sm text-stone-500">
          <p>Everyone is welcome at our table and on the road.</p>
          <p className="mt-1">
            <Link href="/admin" className="hover:text-brand">
              Organizer sign in
            </Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
