import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@shc/types', '@shc/ui', '@shc/business-rules', '@shc/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'ui-avatars.com', pathname: '/**' },
    ],
  },
  turbopack: {}, // empty to satisfy Next 16 + allow our setup in monorepo subdir (transpile + paths handle shared)
  // PWA/SEO
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
};

export default nextConfig;
