import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Validate NEXT_PUBLIC_* environment variables at build/boot time so that
// misconfiguration fails early with a readable message instead of silently
// at request time. Set SKIP_ENV_VALIDATION=true to bypass (e.g. CI type checks).
import './src/lib/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

function getRemotePatterns(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const raw = process.env.NEXT_PUBLIC_PROPERTY_IMAGE_HOSTS ?? '';

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      let protocol: 'http' | 'https' = 'https';
      let hostname = entry;

      const protocolMatch = entry.match(/^(https?):\/\/(.+)$/i);
      if (protocolMatch) {
        protocol = protocolMatch[1].toLowerCase() as 'http' | 'https';
        hostname = protocolMatch[2];
      }

      hostname = hostname.replace(/\/.*$/, '');

      return {
        protocol,
        hostname,
        pathname: '/**',
      };
    });
}

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: getRemotePatterns(),
  },
  env: {
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API ?? '',
  },
};

export default withNextIntl(nextConfig);