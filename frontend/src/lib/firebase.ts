// Firebase client-side configuration for StratAPI
// This file is safe to import on the client — only public keys are used here.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHQMgDtV-JlRfBNgiwpcplMaOLL1IoRP8",
  authDomain: "stratapi-77837.firebaseapp.com",
  projectId: "stratapi-77837",
  storageBucket: "stratapi-77837.firebasestorage.app",
  messagingSenderId: "479960904781",
  appId: "1:479960904781:web:eaa0811bda5d8627351804",
  measurementId: "G-VC63LB4XBD",
};

// Prevent re-initializing the app on hot reload in dev
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export default app;
