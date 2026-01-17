self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const title = data.title || 'Pickup League';
        const options = {
            body: data.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.link || '/'
            }
        };

        event.waitUntil(self.registration.showNotification(title, options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
