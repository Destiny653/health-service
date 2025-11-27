/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://173.249.30.54/dappa/:path*", // your backend (HTTP)
      },
    ];
  },
};

module.exports = nextConfig;
