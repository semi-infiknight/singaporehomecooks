import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "./providers";
import { DevRoleSwitcher } from "./components/DevRoleSwitcher";
import { ErrorBoundary } from "./components/ErrorBoundary";
// shcColors inlined for web build (avoids RN-gluestack dep tree in shc-ui for Next parity build)
const shcColors = { primary: '#1D9E75', background: '#FAF7F2' };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Singapore Home Cooks | Heritage HDB Recipes",
    template: "%s | Singapore Home Cooks",
  },
  description: "Discover and order authentic Singapore heritage home-cooked dishes from verified HDB cooks. Peranakan, Eurasian, festive occasions (Hari Raya, CNY, Deepavali). One-cook orders, PayNow, address privacy protected.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Singapore Home Cooks — Heritage recipes from HDB kitchens",
    description: "Planned occasion orders only. Real home cooks in Tampines, Katong. Allergen disclosure, earnings preview, weekly payouts.",
    images: [{ url: "/og-image.png" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: shcColors.primary,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF7F2] text-[#2C2416]">
        <QueryClientProvider>
          <ErrorBoundary>
            <DevRoleSwitcher />
            <header className="border-b bg-white sticky top-0 z-40">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tracking-tight" style={{ color: shcColors.primary }}>SG Home Cooks</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#F5F0E6] text-[#5C5144]">HDB • Heritage</span>
                </a>
                <nav className="flex items-center gap-4 text-sm">
                  <a href="/#discover" className="hover:underline">Discover</a>
                  <a href="/cart" className="hover:underline">Cart</a>
                  <a href="/orders" className="hover:underline">Orders</a>
                  <a href="/profile" className="hover:underline">Profile (wallet)</a>
                  <a href="/cook-portal" className="hover:underline">Cook Portal</a>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[#5C5144]">GitHub</a>
                </nav>
                <a href="/#switch-mobile" className="text-xs px-3 py-1 border rounded hover:bg-[#F5F0E6]">Switch to Mobile App →</a>
              </div>
            </header>
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
              {children}
            </main>
            <footer className="border-t bg-white text-xs text-[#5C5144] py-6">
              <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-2 items-center justify-between">
                <div>© Singapore Home Cooks — Trust-first marketplace. PDPA compliant. One-cook rule. Collection only (no delivery). See <a href="/content/trust" className="underline">Trust &amp; Safety</a>.</div>
                <div className="flex gap-3">
                  <span>Built for local testing • same seeds + contracts as mobile + backend</span>
                  <a href="http://localhost:3001" className="underline">Web (this)</a> • <a href="http://localhost:8081" target="_blank" className="underline">Mobile Expo</a> • <a href="http://localhost:9000" target="_blank" className="underline">Medusa Admin</a>
                </div>
              </div>
            </footer>
          </ErrorBoundary>
        </QueryClientProvider>
      </body>
    </html>
  );
}
