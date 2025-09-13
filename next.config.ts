import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // This helps with hydration issues
    optimizePackageImports: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-collapsible'],
  },
  // Suppress hydration warnings for development
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextConfig;
