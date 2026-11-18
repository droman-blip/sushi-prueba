import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAUh0WLfIc5QDX6PqoTcMtyvg86NRj5S_8",
  authDomain: "sushishom.firebaseapp.com",
  projectId: "sushishom",
  storageBucket: "sushishom.firebasestorage.app",
  messagingSenderId: "822025962402",
  appId: "1:822025962402:web:3f95a3425b61d9ab3ea8fb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
