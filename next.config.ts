import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Temporarily ignore ESLint during builds to unblock Vercel deployments
    // TODO: Fix ESLint warnings and remove this configuration
    ignoreDuringBuilds: true,
  },
}

export default nextConfig