import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

const rtdbUrl = 'https://wbm-static-default-rtdb.europe-west1.firebasedatabase.app';
export const rtdb = getDatabase(app, rtdbUrl);

