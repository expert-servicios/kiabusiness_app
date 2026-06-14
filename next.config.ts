import type { NextConfig } from 'next';

const SECURITY_HEADERS = [
  // Prevent page from being embedded in iframes (clickjacking protection)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit referrer info sent to external sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 2 years (only effective in production over HTTPS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disable browser features not used by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Extra browser hardening with low compatibility risk for OAuth, Stripe and Calendly flows
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Origin-Agent-Cluster', value: '?1' }
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'expertconsulting.es', 'www.expertconsulting.es'],
      bodySizeLimit: '10mb'
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/microsoft-identity-association.json',
        destination: '/api/well-known/microsoft-identity-association',
      },
    ];
  },
  async redirects() {
    return [
      { source: '/planes/basico', destination: '/planes/avanzado', permanent: true },
      { source: '/planes/estandar', destination: '/planes/colaborativo', permanent: true },
      { source: '/planes/premium', destination: '/planes/presupuesto-personalizado', permanent: true }
    ];
  }
};

export default nextConfig;
