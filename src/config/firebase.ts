// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDU9W1Gf6piyo-jr4Q_EdfYtGbZFHqRZtU",
    authDomain: "zura-app-b3b82.firebaseapp.com",
    projectId: "zura-app-b3b82",
    storageBucket: "zura-app-b3b82.firebasestorage.app",
    messagingSenderId: "317178288048",
    appId: "1:317178288048:web:7154fa91ae79c46d32cecd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);