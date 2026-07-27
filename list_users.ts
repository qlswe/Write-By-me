import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log("=== Users in DB ===");
  for (const doc of usersSnap.docs) {
    console.log(`User ID: ${doc.id}`);
    console.log(`Data:`, doc.data());
  }
}

run().catch(console.error);
