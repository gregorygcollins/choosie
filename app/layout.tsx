import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import { ToastContainer } from "../components/Toast";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Choosie - Do Only What You Love, Together",
  description: "Turn your passions into shared experiences. Create lists, narrow choices together, and discover what you'll love—without scrolling, bickering, or compromise.",
  keywords: ["movie night", "group decisions", "watchlist", "book club", "meal planning", "collaborative choices"],
  authors: [{ name: "Choosie" }],
  openGraph: {
    title: "Choosie - Do Only What You Love, Together",
    description: "Create lists, narrow choices together, and discover what you'll love—no scrolling, no bickering, no compromise.",
    url: "https://choosie-seven.vercel.app",
    siteName: "Choosie",
    type: "website",
    images: [
      {
        url: "https://choosie-seven.vercel.app/og-image.png",
        width: 1200,
        height: 1200,
        alt: "Choosie",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Choosie - Do Only What You Love, Together",
    description: "Create lists, narrow choices together, and discover what you'll love.",
    images: ["https://choosie-seven.vercel.app/og-image.png"],
  },
  icons: {
    icon: "/logo-check.svg",
    shortcut: "/logo-check.svg",
    apple: "/logo-check.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <header className="w-full border-b border-black/6 bg-white/40 backdrop-blur-sm">
              <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
                <Nav />
              </div>
            </header>

            <main className="flex-1">{children}</main>

            <Footer />
          </div>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
