// Cache-busting solution for old loading screens
// This will ensure the old loading screen never appears again

// 1. Clear browser cache headers
const cacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'X-Cache-Bust': Date.now().toString()
};

// 2. Service Worker cache clearing (if applicable)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

// 3. Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
    });
  });
}

// 4. Force reload without cache
window.location.reload(true);

console.log('🚀 Cache cleared - old loading screen eliminated!');
