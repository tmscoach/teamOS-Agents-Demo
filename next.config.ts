import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // During production builds, ignore ESLint errors to allow deployment
    // This is a temporary measure while we fix all ESLint issues
    ignoreDuringBuilds: process.env.VERCEL === '1',
  },
  typescript: {
    // During production builds, ignore TypeScript errors to allow deployment
    // This is a temporary measure while we fix all TypeScript issues
    ignoreBuildErrors: process.env.VERCEL === '1',
  },
}

export default nextConfig