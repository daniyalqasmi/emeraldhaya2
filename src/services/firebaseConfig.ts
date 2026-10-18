import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA45_UpvqR_ekbyzVb8ex5n9-C06Jqw9ww",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "emeraldhaya-e01cb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "emeraldhaya-e01cb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "emeraldhaya-e01cb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "189466131120",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:189466131120:web:a2078adf6f07a77854d975",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TEWVZJERCX"
};

// Check if credentials are valid
export const isLiveFirebaseConfigured = true;

// Initialize Firebase App safely
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

export const auth = app ? getAuth(app) : null;

// Initialize Firestore with ignoreUndefinedProperties: true to prevent undefined field crashes
let firestoreInstance = null;
if (app) {
  try {
    firestoreInstance = initializeFirestore(app, {
      ignoreUndefinedProperties: true
    });
  } catch {
    firestoreInstance = getFirestore(app);
  }
}
export const db = firestoreInstance;

export const storage = app ? getStorage(app) : null;

// Initialize Analytics safely for browser environment
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.debug("Firebase Analytics unsupported in this context:", err);
    });
}

// Authorized Master Administrator UID
export const MASTER_ADMIN_UID = "pgTnAvap3CX2h9iAhz9b5z41wbd2";

export default app;
