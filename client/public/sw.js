self.addEventListener('push', event => {
    if (!event.data) return;

    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],       // vibration pattern on mobile
        requireInteraction: false,       // auto-dismiss after a while
        data: { url: data.url || '/user/queue' } // pass URL through notification
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow(event.notification.data.url);
        })
    );
});