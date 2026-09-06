import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDU9W1Gf6piyo-jr4Q_EdfYtGbZFHqRZtU',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'zura-app-b3b82.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || 'zura-app-b3b82',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'zura-app-b3b82.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '317178288048',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:317178288048:web:34d21215f85ab16feb2875',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Inisialisasi Firestore dengan cache IndexedDB lokal multi-tab agar load instan (< 20ms)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
    }),
});