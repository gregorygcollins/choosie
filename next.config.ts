import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const headers: { key: string; value: string }[] = [
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-XSS-Protection", value: "0" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
      },
    ];

    // Only add HSTS in production behind HTTPS
    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    const scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://js.stripe.com",
      "https://checkout.stripe.com",
      "https://billing.stripe.com",
    ];
    if (!isProd) {
      scriptSrc.push("'unsafe-eval'");
    }

    const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];

    const fontSrc = ["'self'", "https://fonts.gstatic.com", "data:"];

    const connectSrc = [
      "'self'",
      "https://api.themoviedb.org",
      "https://image.tmdb.org",
      "https://books.googleapis.com",
      "https://www.googleapis.com",
      "https://api.spotify.com",
      "https://accounts.spotify.com",
      "https://api.spoonacular.com",
      "https://js.stripe.com",
      "https://api.stripe.com",
      "https://hooks.stripe.com",
      "https://checkout.stripe.com",
      "https://billing.stripe.com",
      "https://vitals.vercel-insights.com",
    ];
    if (!isProd) {
      connectSrc.push("http://localhost:3000", "ws://localhost:3000", "ws://127.0.0.1:3000");
    }

    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://image.tmdb.org",
      "https://i.scdn.co",
      "https://m.media-amazon.com",
      "https://img.youtube.com",
      "https://books.googleusercontent.com",
      "https://spoonacular.com",
      "https://*.unsplash.com",
    ];

    const mediaSrc = ["'self'", "https:"];

    const frameSrc = [
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://checkout.stripe.com",
      "https://billing.stripe.com",
    ];

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      `font-src ${fontSrc.join(" ")}`,
      `img-src ${imgSrc.join(" ")}`,
      `media-src ${mediaSrc.join(" ")}`,
      `connect-src ${connectSrc.join(" ")}`,
      `style-src ${styleSrc.join(" ")}`,
      `script-src ${scriptSrc.join(" ")}`,
      `frame-src ${frameSrc.join(" ")}`,
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
      "object-src 'none'",
      "worker-src 'self' blob:",
      "script-src-attr 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    if (csp) {
      headers.push({ key: "Content-Security-Policy", value: csp });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;
