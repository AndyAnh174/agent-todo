import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API requests to backend to avoid CORS in development.
  // Adjust destination if your backend runs on a different host/port.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_BASE_URL
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`
          : "http://localhost:8000/api/:path*",
      },
    ];
  },
  // Disable trailing slash redirects for API routes
  trailingSlash: false,
  // Disable ESLint during build to avoid blocking
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
