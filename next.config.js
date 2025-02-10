const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  publicRuntimeConfig: {
    baseUrl: 'https://www.foodstream.in'
  },
  env: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['www.foodstream.in'],
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.foodstream.in'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
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
      }
    ]
  },
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  generateEtags: true, // Enable ETag generation
  images: {
    domains: ['www.foodstream.in'], // Add allowed image domains
    minimumCacheTTL: 60,
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      punycode: require.resolve('punycode/')
    }
    return config
  }
}

module.exports = withPWA(nextConfig)
