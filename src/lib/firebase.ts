import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDZ8QEU8pX2ZNAYmGUnehvrWhnYqBgJGZA",
  authDomain: "teamdash-7a94f.firebaseapp.com",
  projectId: "teamdash-7a94f",
  storageBucket: "teamdash-7a94f.firebasestorage.app",
  messagingSenderId: "907933091858",
  appId: "1:907933091858:web:c87da2de06309855aa70cb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
