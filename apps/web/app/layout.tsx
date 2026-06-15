import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "./providers";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppHeader } from "./components/AppHeader";
import { AppFooter } from "./components/AppFooter";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
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
};

export const viewport: Viewport = {
  themeColor: "#D96C4A",
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
            <AppHeader />
            <main className="flex-1 w-full">{children}</main>
            <AppFooter />
          </ErrorBoundary>
        </QueryClientProvider>
      </body>
    </html>
  );
}