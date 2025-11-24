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

export const metadata = {
  title: "Choosie – Do Only What You Love, Together",
  description: "Turn your interests into shared experiences. No scrolling, no bickering, no compromise.",
  openGraph: {
    title: "Choosie – Do Only What You Love, Together",
    description: "Turn your interests into shared experiences. No scrolling, no bickering, no compromise.",
    url: "https://choosie-seven.vercel.app",
    siteName: "Choosie",
    images: [
      {
        url: "https://choosie-seven.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Choosie logo on warm ivory background",
      },
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Choosie – Do Only What You Love, Together",
    description: "Build and share lists with people who love what you love.",
    images: ["https://choosie-seven.vercel.app/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/favicon-v4.ico", sizes: "16x16 32x32 48x48 64x64 128x128 256x256", type: "image/x-icon" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
  themeColor: "#12130F"
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
