const CACHE_NAME = 'driver-location-cache-v1'; // Increment version (e.g., v2) for major updates
let locationData = null;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/driver-location-pwa/index.html',
                '/driver-location-pwa/manifest.json'
            ]);
        })
    );
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'LOCATION_UPDATE') {
        locationData = event.data.data;
        console.log('Service Worker received location:', locationData);
        sendLocationInBackground();
    }
});

function sendLocationInBackground() {
    if (locationData) {
        fetch('https://script.google.com/macros/s/AKfycbw3CbohN_zLk9DT3RYFVyik95a8RYjpWLb3v02u0Jldc6qcVNEk855frU4FdHN6hC9Dxw/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
        })
        .then(() => console.log('Background send success'))
        .catch(err => console.error('Background send error:', err));
    }
}

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'location-sync') {
        event.waitUntil(sendLocationInBackground());
    }
});
