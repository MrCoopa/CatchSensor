import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

cleanupOutdatedCaches()

// Broadcasting for remote debugging
const broadcastLog = (msg, type = 'log') => {
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
        clients.forEach(client => {
            client.postMessage({ type: 'SW_DEBUG_LOG', message: msg, logType: type });
        });
    });
};

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
    if (event.data && event.data.type === 'LOCAL_TEST') {
        broadcastLog('SW: Empfange LOCAL_TEST...');
        const options = {
            body: 'Test vom Service Worker.',
            data: { url: '/' }
        };
        self.registration.showNotification('Test Erfolg! 🎉', options)
            .then(() => broadcastLog('SW: showNotification (local) Erfolg ✅'))
            .catch(err => broadcastLog('SW: showNotification (local) FEHLER ❌: ' + err.message, 'error'));
    }
})

precacheAndRoute(self.__WB_MANIFEST || [])

// Hardened Push Event Listener
self.addEventListener('push', (event) => {
    broadcastLog('SW: Push-Event empfangen 🔔');
    let data = {
        title: 'CatchSensor Meldung',
        body: 'Es gibt eine neue Information.',
    };

    try {
        if (event.data) {
            const rawData = event.data.text();
            broadcastLog('SW: Raw push data: ' + rawData);

            try {
                const jsonData = JSON.parse(rawData);
                data = { ...data, ...jsonData };
                broadcastLog('SW: JSON-Parsing Erfolg');
            } catch (jsonErr) {
                broadcastLog('SW: Kein JSON, nutze Text-Body');
                data.body = rawData;
            }
        }
    } catch (e) {
        broadcastLog('SW: Fehler beim Verarbeiten: ' + e.message, 'error');
    }

    const title = data.title || 'CatchSensor!';
    const options = {
        body: data.body || 'Update verfügbar.',
        tag: 'catchsensor-notification',
        renotify: true,
        requireInteraction: true,
        data: data.data || { url: '/' }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => broadcastLog('SW: Benachrichtigung angezeigt ✅'))
            .catch(err => broadcastLog('SW: showNotification FEHLER ❌: ' + err.message, 'error'))
    );
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
