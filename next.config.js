const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [],
  buildExcludes: [/middleware-manifest.json$/],
  publicExcludes: ['!noprecache/**/*'],
});

module.exports = withPWA({
  reactStrictMode: true,
  pwa: {
    dest: 'public',
    swSrc: 'service-worker.js',
  },
});
