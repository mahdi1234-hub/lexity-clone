import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    
    // Fix Cosmograph internal @/ imports conflicting with Next.js path alias
    const cosmographBase = path.resolve(__dirname, 'node_modules/@cosmograph/cosmograph');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/cosmograph/style.module.css': path.resolve(cosmographBase, 'cosmograph/style.module.css.js'),
    };
    
    return config;
  },
};

export default nextConfig;
