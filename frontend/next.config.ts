import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Tell Turbopack/Next.js not to bundle Prisma's native SQLite binaries.
  // Without this, API routes importing Prisma silently return 404 in dev.
  serverExternalPackages: ["@prisma/client", "prisma", "firebase-admin"],
};

export default nextConfig;
