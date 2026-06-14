// Firebase web config for project "twitch-womens-history" (hosts https://erosolar.org).
// NOTE: the web apiKey is NOT a secret — it identifies the project to Google and is
// safe to ship in the client bundle. Access is controlled by Firebase Auth + Firestore
// security rules + the admin-email gate enforced inside the callable Cloud Functions.
//
// For full features (Auth + Firestore + callable functions):
//   • Blaze plan enabled on the project (for Cloud Functions)
//   • Google sign-in provider enabled (Auth → Sign-in method)
//   • erosolar.org + localhost added to Auth → Settings → Authorized domains
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: 'AIzaSyBJ1SKKtK52dtvhqY8_uZ_Ssi3_CYaknf8',
  authDomain: 'twitch-womens-history.firebaseapp.com',
  projectId: 'twitch-womens-history',
  storageBucket: 'twitch-womens-history.firebasestorage.app',
  messagingSenderId: '972814069603',
  appId: '1:972814069603:web:c16970794471d481076d56',
  measurementId: 'G-DJ0F8GXZH7',
};

// Single shared app instance — importing this everywhere prevents the
// "Firebase App named '[DEFAULT]' already exists" crash that happens when two
// services each call initializeApp().
export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// The live canonical URL is https://erosolar.org (custom domain on Firebase Hosting).
