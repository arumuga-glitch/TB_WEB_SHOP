import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://192.168.1.50:3001",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // destination: "https://api2.thendralbooking.com/:path*",
         destination: "http://localhost:8081/:path*",
      },
    ];
  },
};

export default nextConfig;
