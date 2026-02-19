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

// Mandatory Fetch Handler for PWA Installability
self.addEventListener('fetch', (event) => {
    // We let Workbox handle the caching via precacheAndRoute,
    // but the presence of this listener is a requirement for the "Install" prompt.
    if (event.request.mode === 'navigate') {
        // Optional: Could add custom offline logic here
    }
});

// Hardened Push Event Listener for maximum Android compatibility
self.addEventListener('push', (event) => {
    broadcastLog('SW: Push-Event empfangen 🔔');

    // Always provide a fallback to ensure Android (Chrome) doesn't suppress the notification
    // If showNotification isn't called, Chrome may stop delivering pushes to the site.
    let pushData = {
        title: 'CatchSensor Nachricht',
        body: 'Es gibt eine neue Statusmeldung.',
        icon: '/icons/fox-logo.png',
        badge: '/icons/fox-logo.png',
        vibrate: [100, 50, 100],
        tag: 'catchsensor-notification',
        data: { url: '/' }
    };

    if (event.data) {
        try {
            // Try parsing as JSON first
            const json = event.data.json();
            broadcastLog('SW: JSON-Parsing erfolgreich');
            pushData = { ...pushData, ...json };
        } catch (err) {
            broadcastLog('SW: JSON-Fehler, nutze Text-Fallback');
            pushData.body = event.data.text();
        }
    }

    const title = pushData.title || 'CatchSensor!';
    const options = {
        body: pushData.body || 'Neue Info verfügbar.',
        icon: pushData.icon || '/icons/fox-logo.png',
        badge: pushData.badge || '/icons/fox-logo.png',
        vibrate: pushData.vibrate || [100, 50, 100],
        tag: pushData.tag || 'catchsensor-notification',
        renotify: true,
        requireInteraction: true,
        data: pushData.data || { url: '/' },
        actions: [
            { action: 'open', title: 'Öffnen' },
            { action: 'close', title: 'Schließen' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => broadcastLog('SW: Benachrichtigung angezeigt ✅'))
            .catch(err => {
                broadcastLog('SW: showNotification FEHLER ❌: ' + err.message, 'error');
                // Absolute last resort for Chromium browsers
                return self.registration.showNotification('CatchSensor Alpha', { body: 'Meldung eingegangen.' });
            })
    );
});


self.addEventListener('notificationclick', (event) => {
    broadcastLog('SW: Notification-Click empfangen, Action: ' + event.action);
    event.notification.close();

    if (event.action === 'close') return;

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
