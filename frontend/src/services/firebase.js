import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Active Firebase App Config registered for SIH 2026 (sih-2026-compliance)
const firebaseConfig = {
  apiKey: "AIzaSyAKvLUdlbGHWXOJJoy3sE6CbigsIQBtsZ8",
  authDomain: "sih-2026-compliance.firebaseapp.com",
  projectId: "sih-2026-compliance",
  storageBucket: "sih-2026-compliance.firebasestorage.app",
  messagingSenderId: "728345246333",
  appId: "1:728345246333:web:0e66ab84927dcba379cf14"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
