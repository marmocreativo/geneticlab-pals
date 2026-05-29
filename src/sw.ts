/// <reference lib="webworker" />
/// <reference types="vite-plugin-pwa/client" />
declare const __WB_MANIFEST: Array<{ revision: string | null; url: string }>

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'


// Precaching (Vite PWA inyecta el manifest aquí)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// skipWaiting + clientsClaim
const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis
sw.skipWaiting()
clientsClaim()

// Navegación — siempre sirve index.html
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'html-cache',
      networkTimeoutSeconds: 5,
      plugins: [
        new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }),
        new CacheableResponsePlugin({ statuses: [0, 200] })
      ]
    }),
    { denylist: [/^\/api/, /\.map$/] }
  )
)

// JS/CSS — NetworkFirst
registerRoute(
  /\.(?:js|css)$/i,
  new NetworkFirst({
    cacheName: 'app-shell',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

// Supabase REST/Auth/Realtime — nunca cachear
registerRoute(/^https:\/\/.*\.supabase\.co\/rest\/.*/i, new NetworkOnly())
registerRoute(/^https:\/\/.*\.supabase\.co\/auth\/.*/i, new NetworkOnly())
registerRoute(/^https:\/\/.*\.supabase\.co\/realtime\/.*/i, new NetworkOnly())

// Supabase Storage
registerRoute(
  /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
  new StaleWhileRevalidate({
    cacheName: 'supabase-storage-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 2 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

// Google Maps
registerRoute(
  /^https:\/\/maps\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-maps-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ]
  })
)
registerRoute(
  /^https:\/\/maps\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-maps-tiles',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 })
    ]
  })
)

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })
    ]
  })
)
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })
    ]
  })
)

// ── Push Notifications ──────────────────────────────────────
sw.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    sw.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url ?? '/' }
    })
  )
})

// Al hacer click en la notificación abre la app
sw.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) return clientList[0].focus()
        return sw.clients.openWindow(event.notification.data?.url ?? '/')
      })
  )
})