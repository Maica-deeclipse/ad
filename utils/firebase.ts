import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

//web app's Firebase configuration

export const firebaseConfig = {
  apiKey: "AIzaSyBEHZnK_J-qvKqWd7Ly-MtCQYe_w0f-vjE",
  authDomain: "crud-c1d90.firebaseapp.com",
  projectId: "crud-c1d90",
  storageBucket: "crud-c1d90.firebasestorage.app",
  messagingSenderId: "1026325947308",
  appId: "1:1026325947308:web:8db89049f7dcfdd4a55009"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export const getNamedFirebaseApp = (name: string): FirebaseApp => {
  return getApps().some((appInstance) => appInstance.name === name)
    ? getApp(name)
    : initializeApp(firebaseConfig, name);
};

export default app;
