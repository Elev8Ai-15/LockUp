/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Force clean module resolution
  serverExternalPackages: [],
}

export default nextConfig
