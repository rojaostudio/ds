import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rojaostudio/ds'],
  images: { formats: ['image/avif'] },
};

export default nextConfig;
