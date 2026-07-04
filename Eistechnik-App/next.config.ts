import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eistechnikcenter-gmbh.b-cdn.net",
        pathname: "/Programmierung/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/anfahrtskosten",
        destination: "/v1",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
