const CACHE_NAME = 'driver-location-cache';
let locationData = null;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/index.html']);
        })
    );
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'LOCATION_UPDATE') {
        locationData = event.data.data;
        console.log('Service Worker received location:', locationData);
        // Attempt to send in background (limited by browser)
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

// Periodic sync (experimental, requires registration)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'location-sync') {
        event.waitUntil(sendLocationInBackground());
    }
});