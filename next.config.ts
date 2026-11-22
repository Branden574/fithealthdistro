import type { NextConfig } from 'next';

const privateHeaders = [
  // Admin pages and the draft preview are for signed-in admins only: never cache, never index.
  { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Framing, plugins, base and form targets are locked down. Scripts are not restricted yet: Next.js inline scripts need nonces.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Storefront reads are cached with 'use cache' and expired by tag when the owner publishes.
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: privateHeaders },
      { source: '/admin', headers: privateHeaders },
      { source: '/preview', headers: privateHeaders },
      { source: '/preview/:path*', headers: privateHeaders },
    ];
  },
};

export default nextConfig;
