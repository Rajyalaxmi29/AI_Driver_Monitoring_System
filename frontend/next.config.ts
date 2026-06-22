import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.6', 'localhost'],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5005/api/:path*",
      },
    ];
  },
};

export default nextConfig;
