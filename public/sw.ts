/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const self: ServiceWorkerGlobalScope

// Handle message dari client untuk skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    // Skip waiting untuk activate service worker baru
    self.skipWaiting()
  }
})

// Cleanup cache lama saat activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Dapatkan semua cache names
      const cacheNames = await caches.keys()

      // Hapus semua cache (optional - untuk development)
      // Atau implementasikan versioning strategy yang lebih canggih
      const isDevMode = !import.meta.env.PROD

      if (!isDevMode) {
        // Di production, pertahankan cache yang valid
        await Promise.all(
          cacheNames.map((cacheName) => {
            // Keep hanya cache yang masih valid
            return caches.delete(cacheName)
          })
        )
      }
    })()
  )

  // Claim clients immediately
  self.clients.claim()
})

// Log untuk debugging
if (import.meta.env.DEV) {
  self.addEventListener('install', () => {
    console.log('[SW] Service Worker installed')
  })

  self.addEventListener('activate', () => {
    console.log('[SW] Service Worker activated')
  })

  self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
      console.log('[SW] Skip waiting message received')
    }
  })
}
