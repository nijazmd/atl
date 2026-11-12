import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAWwQy7U71hhQz-3toh740kx5QLCysxFKs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "al-atl.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "al-atl",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "al-atl.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "198009842406",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:198009842406:web:2844cd643edd17444ca927",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NKW37CPFB1",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

