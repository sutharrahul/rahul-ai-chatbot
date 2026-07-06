import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal `.next/standalone` build (only the files needed at
  // runtime, deps traced automatically) so the Docker image doesn't need
  // to ship node_modules or devDependencies - see frontend/Dockerfile.
  output: "standalone",
};

export default nextConfig;
