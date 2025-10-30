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

    // A conservative CSP; relaxed in dev to avoid blocking Next dev features
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      // Allow images, audio from https and data URIs
      "img-src 'self' https: data:",
      "media-src 'self' https:",
      // Allow connections to same-origin and https APIs (Stripe, OAuth, etc.)
      "connect-src 'self' https:",
      // Next.js may inline styles; allow inline styles
      "style-src 'self' 'unsafe-inline' https:",
      // Next.js uses inline scripts for hydration - need unsafe-inline in production
      isProd
        ? "script-src 'self' 'unsafe-inline' https:"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      // Stripe embeds
      "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com",
      "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    ]
      .filter(Boolean)
      .join("; ");

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