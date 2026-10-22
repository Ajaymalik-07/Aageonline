import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Prevent Next.js from deleting previous static chunks on build
  cleanDistDir: false,
  // Disable powered by header
  poweredByHeader: false,
  // Generate stable build ID to prevent deployment skew
  generateBuildId: async () => {
    return 'aageonline-admin-production';
  },
};

export default nextConfig;
