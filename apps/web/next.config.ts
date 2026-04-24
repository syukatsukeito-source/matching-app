import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
