importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');


const firebaseConfig = {
    apiKey: "AIzaSyDVENvYCy1RqQXNqkoirfWicUjs2IFwCPk",
    authDomain: "thendralbooking-77dbe.firebaseapp.com",
    projectId: "thendralbooking-77dbe",
    storageBucket: "thendralbooking-77dbe.firebasestorage.app",
    messagingSenderId: "882472148505",
    appId: "1:882472148505:web:6a88f61287c9cc0cdb9488",
};

// Initialize synchronously — required so Firebase can register
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Force immediate activation on install/update
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Resolve the default URL based on topic/type
function resolveTopicUrl(payload) {
    const type = payload?.data?.type || payload?.data?.topic || '';
    const id = payload?.data?.id || '';

    if (type.includes('alert')) return '/dashboard';
    if (type.includes('news')) return id ? `/dashboard/news/${id}` : '/dashboard/news';

    return '/dashboard';
}

// Helper to notify all open clients (tabs)
async function broadcastMessage(payload, action = 'received') {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientsList.forEach((client) => {
        client.postMessage({
            type: 'FCM_NOTIFICATION',
            action,
            payload
        });
    });
}

// Handle background messages (app is closed or in background)
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message: ', payload);

    const title = payload.data?.title || payload.notification?.title || 'New Notification';
    const body = payload.data?.body || payload.notification?.body || '';

    const options = {
        body,
        icon: '/assets/images/img_logo.png',
        badge: '/assets/images/img_logo.png',
        data: {
            url: resolveTopicUrl(payload),
            type: payload.data?.type || payload.data?.topic || 'news',
            messageId: payload.messageId
        }
    };

    self.registration.showNotification(title, options);

    // Broadcast to any open but background tabs
    broadcastMessage(payload, 'received');
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/dashboard/news';

    // Broadcast specifically to the client about to be opened/focused
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    client.postMessage({ type: 'FCM_NOTIFICATION', action: 'clicked', payload: event.notification });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen).then(client => {
                    // Short delay to ensure client is ready for message
                    if (client) setTimeout(() => {
                        client.postMessage({ type: 'FCM_NOTIFICATION', action: 'clicked', payload: event.notification });
                    }, 2000);
                });
            }
        })
    );
});
