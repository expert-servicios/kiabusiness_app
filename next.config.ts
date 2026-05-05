import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'kseniailicheva.com', 'www.kseniailicheva.com'],
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;
