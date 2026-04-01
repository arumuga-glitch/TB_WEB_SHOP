import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if config is present
const isConfigValid = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const app = typeof window !== "undefined" && isConfigValid
    ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig))
    : null;

let messaging: Messaging | undefined;

if (typeof window !== "undefined" && app) {
    messaging = getMessaging(app);
}

/**
 * Explicitly request the browser's notification permission.
 * Returns true when granted, false when denied or unsupported.
 * Call this BEFORE requestForToken so we know the exact reason for failure.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (!("Notification" in window)) {
        console.warn("⚠️ This browser does not support desktop notifications.");
        return false;
    }
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") {
        console.warn("⚠️ Notification permission was previously denied. User must reset it in browser settings.");
        return false;
    }
    // Show the native browser prompt
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        console.warn("⚠️ Notification permission not granted by user.");
        return false;
    }
    return true;
};

export const requestForToken = async () => {
    if (typeof window === "undefined") return;

    if (!isConfigValid) {
        console.warn("⚠️ Firebase configuration is missing or invalid. Check your .env file.");
        return;
    }

    if (!messaging) {
        console.warn("⚠️ Firebase Messaging is not initialized. Check if background notifications are supported in this browser.");
        return;
    }

    try {
        // Register the Firebase SW explicitly with its own scope so it doesn't
        // conflict with any other service worker (e.g. sw.js).
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/firebase-cloud-messaging-push-scope',
        });

        // Wait for THIS specific registration to become active — NOT navigator.serviceWorker.ready,
        // because .ready resolves to whatever SW controls the page, which may NOT be the FCM SW.
        await new Promise<void>((resolve) => {
            if (registration.active) {
                resolve();
                return;
            }
            const sw = registration.installing || registration.waiting;
            if (sw) {
                sw.addEventListener('statechange', function handler() {
                    if (sw.state === 'activated') {
                        sw.removeEventListener('statechange', handler);
                        resolve();
                    }
                });
            } else {
                resolve(); // Already active via a previous registration
            }
        });

        const currentToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
        });

        if (currentToken) {
            return currentToken;
        } else {
            console.warn("⚠️ No registration token available. Request permission to generate one.");
        }
    } catch (err) {
        console.error("❌ An error occurred while retrieving FCM token: ", err);
    }
};


export const onMessageListener = async (callback: (payload: any) => void) => {
    if (!messaging) return;
    return onMessage(messaging, (payload) => {
        console.log("On Message Listener:", payload);
        callback(payload);
    });
};

export { app, messaging };
