import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    turbopackRustReactCompiler: true,
    useOffline: true,
    serverActions: {
      allowedOrigins: ["hr.medicine.up.ac.th"],
      // allowedForwardedHosts: ['localhost:3000'],
    },
  },
};

export default nextConfig;
