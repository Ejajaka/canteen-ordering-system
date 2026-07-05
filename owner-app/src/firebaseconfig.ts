// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBfDWVlKBQKOUTOW8xQoHV7g7p0PVR_X6g",
  authDomain: "mycanteen-516f4.firebaseapp.com",
  projectId: "mycanteen-516f4",
  storageBucket: "mycanteen-516f4.appspot.com",
  messagingSenderId: "12999492956",
  appId: "1:12999492956:web:3412f7ba3dc8cb3b9c6d99",
  measurementId: "G-08Z8TYRGSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);