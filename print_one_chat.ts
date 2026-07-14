import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";
  const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
  
  let out = `=== Messages in ${chatId} ===\n`;
  for (const doc of messagesSnap.docs) {
    out += `Msg ID: ${doc.id}\n`;
    out += `Data: ${JSON.stringify(doc.data(), null, 2)}\n\n`;
  }
  
  fs.writeFileSync('messages_log.txt', out, 'utf8');
  console.log("Successfully wrote messages to messages_log.txt");
}

run().catch(console.error);
