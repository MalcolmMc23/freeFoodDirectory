import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return [
      {
        source: "/neighborhood/:slug",
        destination: "/san-francisco/neighborhood/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
