import type { Metadata, Viewport } from "next"; // Added Viewport import
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// CRITICAL: This ensures the mobile browser respects the device width
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "KIMOO CRT | Institutional Execution",
  description: "Advanced Trade Execution Terminal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-zinc-100 selection:bg-blue-500/30 overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Subtle Background Glow - Optimized with will-change */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div 
            className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full will-change-transform" 
          />
        </div>
        
        {children}
      </body>
    </html>
  );
}
