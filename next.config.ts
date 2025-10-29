import type { NextConfig } from "next";

// Configure Turbopack to use this folder as the root to avoid multiple lockfile warnings
const nextConfig: NextConfig = {
  turbopack: {
    // Use this directory as the root for Turbopack
    root: __dirname,
  },
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
