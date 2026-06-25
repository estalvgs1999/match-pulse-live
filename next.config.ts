import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal, self-contained production server for Docker (see Dockerfile).
  output: "standalone",
};

export default nextConfig;
