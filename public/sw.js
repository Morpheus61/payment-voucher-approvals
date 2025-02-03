self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('relish-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/_next/static/css/',
        '/_next/static/chunks/',
        '/icons/icon-192x192.png'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
