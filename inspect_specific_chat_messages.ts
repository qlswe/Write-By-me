import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";
  const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
  console.log(`=== Messages in ${chatId} ===`);
  for (const doc of messagesSnap.docs) {
    console.log(`Msg ID: ${doc.id}`);
    console.log(`Data:`, doc.data());
  }

  // Also query other chats just in case
  const chatsSnap = await getDocs(collection(db, 'chats'));
  for (const chatDoc of chatsSnap.docs) {
    const chatData = chatDoc.data();
    if (chatDoc.id !== chatId) {
      const subMsgs = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
      if (subMsgs.docs.length > 0) {
        console.log(`=== Messages in ${chatDoc.id} ===`);
        for (const mDoc of subMsgs.docs) {
          console.log(`Msg ID: ${mDoc.id}`);
          console.log(`Data:`, mDoc.data());
        }
      }
    }
  }
}

run().catch(console.error);
