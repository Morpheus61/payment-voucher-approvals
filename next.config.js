/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    domains: ['payment-voucher-approvals.vercel.app'],
    unoptimized: false
  }
}

module.exports = nextConfig
