import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ['pg'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        pg: false,
        'pg-native': false,
        'util/types': false,
      };
    }
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/explore',
        destination: '/markets',
        permanent: true,
      },
      {
        source: '/claim',
        destination: '/business/claim',
        permanent: true,
      },
      {
        source: '/how-it-works',
        destination: '/#how-it-works',
        permanent: false,
      },
      {
        source: '/trust',
        destination: '/#trust',
        permanent: false,
      },
      {
        source: '/knowledge',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/knowledge/:slug*',
        destination: '/blog/:slug*',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/business/claim',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
