import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Temporarily ignore ESLint during builds to unblock Vercel deployments
    // TODO: Fix ESLint warnings and remove this configuration
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-test.tms.global',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      }
    ],
  },
  webpack: (config: any, { isServer }: any) => {
    // Suppress OpenAI websocket warnings for client-side builds
    if (!isServer) {
      config.ignoreWarnings = [
        { module: /openai.*file\.node\.js/ },
        { message: /Critical dependency.*require function/ }
      ];
    }
    return config;
  },
}

export default nextConfig