import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  transpilePackages: ["@clerk/nextjs"],
};

export default nextConfig;
