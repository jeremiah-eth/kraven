import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundStars from "@/features/home/components/BackgroundStars";
import SiteHeader from "@/features/home/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KRAVEN | Base Alert Bot",
  description: "24/7 Telegram Alert Bot for Clanker and Doppler factory deployments on Base.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  openGraph: {
    title: "KRAVEN | Base Alert Bot",
    description: "24/7 Telegram Alert Bot for Clanker and Doppler factory deployments on Base.",
    url: 'https://kraven.bot',
    siteName: "KRAVEN",
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "KRAVEN",
    description: "Join the KRAVEN waitlist",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#070707]! antialiased`}
      >
        <Toaster position="top-right" richColors />
        <BackgroundStars />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
