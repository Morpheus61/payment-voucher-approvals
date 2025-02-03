const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['www.foodstream.in', 'foodstream.in'],
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'payment-voucher-approvals.vercel.app',
          },
        ],
        destination: 'https://www.foodstream.in',
        permanent: true,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
