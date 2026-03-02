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

// Resolve the default URL based on topic
function resolveTopicUrl(payload) {
    const topic = payload?.data?.topic || '';
    if (topic === 'alerts') return '/dashboard';
    return '/dashboard/news'; 
}

// Handle background messages (app is closed or in background)
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = payload.notification?.title || 'New Notification';
    const topic = payload?.data?.topic || 'news';
    const defaultUrl = resolveTopicUrl(payload);

    const options = {
        body: payload.notification?.body || '',
        icon: payload.notification?.image || '/assets/images/img_logo.png',
        badge: '/assets/images/img_logo.png',
        data: {
            url: payload.data?.url || defaultUrl,
            topic,
        },
    };

    self.registration.showNotification(title, options);
});

// Handle notification click — open/focus the correct page based on topic
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || '/dashboard/news';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
