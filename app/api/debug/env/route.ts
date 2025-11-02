import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? `✓ Set: ${process.env.NEXTAUTH_URL}` : "✗ Not set (OK for NextAuth v5)",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_URL: process.env.VERCEL_URL || "Not on Vercel",
  };

  return NextResponse.json({
    message: "Environment Variable Check",
    variables: envVars,
    timestamp: new Date().toISOString(),
  });
}
