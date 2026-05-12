import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Opt out of anonymous telemetry
  // Set NEXT_TELEMETRY_DISABLED=1 in .env or devcontainer to suppress it
};

export default nextConfig;
