// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfDWVlKBQKOUTOW8xQoHV7g7p0PVR_X6g",
  authDomain: "mycanteen-516f4.firebaseapp.com",
  projectId: "mycanteen-516f4",
  storageBucket: "mycanteen-516f4.firebasestorage.app",
  messagingSenderId: "12999492956",
  appId: "1:12999492956:web:3412f7ba3dc8cb3b9c6d99",
  measurementId: "G-08Z8TYRGSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// 🔹 Ensure auth doesn’t auto-login old sessions
setPersistence(auth, browserSessionPersistence).catch(console.error);

export { analytics };