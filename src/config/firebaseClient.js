require('dotenv').config();
const { initializeApp, getApps, getApp } = require('firebase/app');
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyC0fAl4tItsI_JNLR0C1G_Mf1fPSAnYJ1g",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "work-mock-c479f.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "work-mock-c479f",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "work-mock-c479f.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "298064435019",
  appId: process.env.FIREBASE_APP_ID || "1:298064435019:web:5af133975f2b9acd347ace",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-K43LTPYPT6",
};

// Initialize Firebase Client App (singleton pattern)
const clientApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const clientAuth = getAuth(clientApp);
const clientDb = getFirestore(clientApp);

module.exports = {
  clientApp,
  clientAuth,
  clientDb,
  firebaseConfig,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
};
