// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDU9W1Gf6piyo-jr4Q_EdfYtGbZFHqRZtU",
    authDomain: "zura-app-b3b82.firebaseapp.com",
    projectId: "zura-app-b3b82",
    storageBucket: "zura-app-b3b82.firebasestorage.app",
    messagingSenderId: "317178288048",
    appId: "1:317178288048:web:34d21215f85ab16feb2875"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();