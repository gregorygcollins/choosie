import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Nav from "../components/Nav";
import { Footer } from "../components/Footer";
import { InstallChoosiePrompt } from "../components/InstallChoosiePrompt";
import { ServiceWorkerRegistration } from "../components/ServiceWorkerRegistration";
import { ToastContainer } from "../components/Toast";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.choosietogether.com";

export const metadata: Metadata = {
  title: "Choosie – Do Only What You Love, Together",
  applicationName: "Choosie",
  description: "Turn reluctant consensus into passionate overlap. No scrolling, no bickering, no compromise.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Choosie"
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    title: "Choosie – Do Only What You Love, Together",
    description: "Turn reluctant consensus into passionate overlap. No scrolling, no bickering, no compromise.",
    url: siteUrl,
    siteName: "Choosie",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Choosie logo",
      },
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Choosie – Do Only What You Love, Together",
    description: "Turn reluctant consensus into passionate overlap. No scrolling, no bickering, no compromise.",
    images: [`${siteUrl}/og-image.png`]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64", type: "image/x-icon" },
      { url: "/choosie-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/choosie-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#1A365D"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
  <body
      className={`${inter.variable} ${robotoMono.variable} antialiased`}
        >
        <Providers>
          <ServiceWorkerRegistration />
          <InstallChoosiePrompt />
          <div className="min-h-screen flex flex-col">
            <header className="relative z-[200] w-full border-b border-black/6 bg-white/40 backdrop-blur-sm">
              <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
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
