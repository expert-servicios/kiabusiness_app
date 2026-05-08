import type { NextConfig } from 'next';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'kseniailicheva.com', 'www.kseniailicheva.com'],
      bodySizeLimit: '10mb'
    }
  },
  turbopack: {
    root: rootDir
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
