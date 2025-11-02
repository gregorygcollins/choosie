import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? `✓ Set: ${process.env.NEXTAUTH_URL}` : "✗ Not set (OK for NextAuth v5)",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
    // Media/Search APIs
    NEXT_PUBLIC_TMDB_API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY ? "✓ Set" : "✗ Missing",
    TMDB_API_KEY: process.env.TMDB_API_KEY ? "✓ Set" : "✗ Missing",
    GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY ? "✓ Set" : "✗ Missing (will use built-in demo key)",
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? "✓ Set" : "✗ Missing",
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✓ Set" : "✗ Missing",
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ? `✓ Set: ${process.env.STRIPE_PRICE_ID}` : "✗ Missing",
  STRIPE_PRICE_LOOKUP_KEY: process.env.STRIPE_PRICE_LOOKUP_KEY ? `✓ Set: ${process.env.STRIPE_PRICE_LOOKUP_KEY}` : "✗ Not set (optional alternative)",
  STRIPE_PRODUCT_ID: process.env.STRIPE_PRODUCT_ID ? `✓ Set: ${process.env.STRIPE_PRODUCT_ID}` : "✗ Not set (optional alternative)",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "✓ Set" : "✗ Missing (required for webhooks)",
    STRIPE_PORTAL_CONFIGURATION_ID: process.env.STRIPE_PORTAL_CONFIGURATION_ID ? "✓ Set" : "✗ Not set (optional)",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL || "Not on Vercel",
  };

  return NextResponse.json({
    message: "Environment Variable Check",
    variables: envVars,
    timestamp: new Date().toISOString(),
  });
}
