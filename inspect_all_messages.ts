import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Searching all messages...");
  const chatsSnap = await getDocs(collection(db, 'chats'));
  for (const chatDoc of chatsSnap.docs) {
    const messagesSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
    for (const msgDoc of messagesSnap.docs) {
      const data = msgDoc.data();
      if (data.text && data.text.includes('AES_V2_ROLLING')) {
        console.log(`Chat: ${chatDoc.id}, MsgID: ${msgDoc.id}`);
        console.log(`  Raw Text: "${data.text}"`);
        // Check characters
        const pipeIndex = data.text.indexOf('|');
        const iIndex = data.text.indexOf('I');
        console.log(`  Pipe Index: ${pipeIndex}, 'I' Index: ${iIndex}`);
      }
    }
  }
}

run().catch(console.error);
