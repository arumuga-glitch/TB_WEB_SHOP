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
        // Register the service worker manually to avoid default registration timeout
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
        });

        // Ensure service worker is active before requesting token
        await navigator.serviceWorker.ready;

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
