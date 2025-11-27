import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "http://173.249.30.54/dappa/:path*",
      },
    ];
  },
};

export default nextConfig;
