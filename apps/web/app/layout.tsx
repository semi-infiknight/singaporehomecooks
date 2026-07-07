import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "./providers";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppChrome } from "./components/AppChrome";
import { PWARegistration } from "./components/PWARegistration";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SHC_WEB_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://web-production-9226.up.railway.app");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Singapore Home Cooks | Heritage HDB Recipes",
    template: "%s | Singapore Home Cooks",
  },
  description:
    "Discover and order authentic Singapore heritage home-cooked dishes from verified HDB cooks. Peranakan, Eurasian, festive occasions. One-cook orders, PayNow, address privacy protected.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Singapore Home Cooks — Heritage recipes from HDB kitchens",
    description:
      "Planned occasion orders only. Real home cooks in Tampines, Katong. Allergen disclosure, weekly payouts.",
    images: [{ url: "/og-image.png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SG Home Cooks",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#F87048",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryClientProvider>
          <ErrorBoundary>
            <AppChrome>{children}</AppChrome>
            <PWAInstallBanner />
            <PWARegistration />
          </ErrorBoundary>
        </QueryClientProvider>
      </body>
    </html>
  );
}