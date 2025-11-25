/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
      // Exclude server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push('pg-boss');
    }
    return config;
  },
  serverExternalPackages: [
    'replicate',
    'pg',
    'pg-boss',
    '@google/genai',
    'sharp',
    '@prisma/client',
    'prisma',
  ],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'zod',
    ],
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;

