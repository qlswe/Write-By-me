import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("=== USERS ===");
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const doc of usersSnap.docs) {
    console.log(`User: ${doc.id} ->`, doc.data());
  }

  console.log("=== CHATS ===");
  const chatsSnap = await getDocs(collection(db, 'chats'));
  for (const doc of chatsSnap.docs) {
    console.log(`Chat: ${doc.id} ->`, doc.data());
  }
}

run().catch(console.error);
