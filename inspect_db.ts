import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching chats...");
  const chatsSnap = await getDocs(collection(db, 'chats'));
  for (const chatDoc of chatsSnap.docs) {
    console.log(`Chat ID: ${chatDoc.id}`);
    console.log(`Chat Data:`, chatDoc.data());
    const messagesSnap = await getDocs(query(collection(db, 'chats', chatDoc.id, 'messages'), limit(10)));
    for (const msgDoc of messagesSnap.docs) {
      console.log(`  Message ID: ${msgDoc.id}`);
      console.log(`  Message Data:`, msgDoc.data());
    }
  }
}

run().catch(console.error);
