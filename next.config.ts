import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly allow your LAN/dev origin
  allowedDevOrigins: [
    "https://192.168.1.50:3001",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api2.thendralbooking.com/:path*",
      },
    ];
  },
};

export default nextConfig;
