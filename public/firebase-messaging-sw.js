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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Force immediate activation — important so this SW takes control immediately
// after install/update without waiting for all open tabs to close.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ── URL resolver ─────────────────────────────────────────────────────────────
// Determines which page to open when the user clicks a notification.
// Priority: webpush.fcmOptions.link → data.url → resolved from type/id
function resolveClickUrl(notificationData, fcmMsgData) {
    // 1. webpush.fcmOptions.link is stored by Firebase in notification.data.FCM_MSG.fcmOptions.link
    const fcmOptionsLink = notificationData?.FCM_MSG?.fcmOptions?.link;
    if (fcmOptionsLink && fcmOptionsLink !== '/') return fcmOptionsLink;

    // 2. Explicit url field in our data payload
    const dataUrl = fcmMsgData?.url || notificationData?.url;
    if (dataUrl) return dataUrl;

    // 3. Fallback: resolve from type + id
    const type = fcmMsgData?.type || fcmMsgData?.topic || '';
    const id = fcmMsgData?.id || '';
    if (type.includes('alert')) return '/dashboard';
    if (type.includes('news')) return id ? `/dashboard/news/${id}` : '/dashboard/news';
    return '/dashboard';
}

// ── Broadcast to all open tabs ────────────────────────────────────────────────
async function broadcastMessage(payload, action) {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clientsList.forEach((client) => {
        client.postMessage({
            type: 'FCM_NOTIFICATION',
            action: action || 'received',
            payload
        });
    });
}

// ── Background message handler ────────────────────────────────────────────────
// Fires when the web app is in the background OR closed.
// When the FCM message has a `notification` field AND `webpush.fcmOptions.link`,
// Firebase automatically displays the notification and handles the click.
// In that case we skip manual showNotification to avoid a duplicate.
// We still broadcast so any open (background) tabs can update their store.
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message received:', payload);

    const hasNotification = !!payload.notification;
    const hasWebPushLink = !!payload.fcmOptions?.link;

    if (!hasNotification || !hasWebPushLink) {
        // Data-only message OR webpush.fcmOptions.link is missing — show manually
        const title = payload.data?.title || payload.notification?.title || 'New Notification';
        const body = payload.data?.body || payload.notification?.body || '';
        const type = payload.data?.type || payload.data?.topic || '';
        const id = payload.data?.id || '';

        let url = '/dashboard';
        if (type.includes('news')) url = id ? `/dashboard/news/${id}` : '/dashboard/news';

        const options = {
            body,
            icon: '/assets/images/img_logo.png',
            badge: '/assets/images/img_logo.png',
            data: {
                url,
                type,
                messageId: payload.messageId
            }
        };

        self.registration.showNotification(title, options);
    }

    // Always broadcast to update any open background tabs' in-app store
    broadcastMessage(payload, 'received');
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Firebase stores the full FCM message in event.notification.data.FCM_MSG
    // when IT auto-displays the notification.
    // For manually-created notifications (from our showNotification call above),
    // the data is directly in event.notification.data.
    const notifData = event.notification.data || {};
    const fcmMsg = notifData.FCM_MSG || {};
    const fcmMsgData = fcmMsg.data || notifData;

    const urlToOpen = resolveClickUrl(notifData, fcmMsgData);

    console.log('[FCM SW] Notification clicked, opening URL:', urlToOpen);

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Try to focus an existing tab at the target URL
            for (const client of windowClients) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    client.postMessage({ type: 'FCM_NOTIFICATION', action: 'clicked', payload: notifData });
                    return client.focus();
                }
            }
            // No matching tab — focus any open app tab so navigation is smooth
            for (const client of windowClients) {
                if ('focus' in client && 'navigate' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            // No open tabs at all — open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen).then((client) => {
                    if (client) {
                        setTimeout(() => {
                            client.postMessage({ type: 'FCM_NOTIFICATION', action: 'clicked', payload: notifData });
                        }, 1500);
                    }
                });
            }
        })
    );
});
