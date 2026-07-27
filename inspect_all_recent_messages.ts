import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import fs from 'fs';
import { decrypt } from './src/utils/encryption';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatId = "ZDl2ElMREqTk3PMS80exNuGgDcH2_riwEcrLjeof6wg6PDIA9KZbdUGh2";
  const messagesSnap = await getDocs(query(collection(db, 'chats', chatId, 'messages')));
  console.log(`=== All messages in ${chatId} ===`);
  for (const doc of messagesSnap.docs) {
    const data = doc.data();
    console.log(`Msg ID: ${doc.id}`);
    console.log(`Sender: ${data.senderId}`);
    console.log(`Raw text: "${data.text}"`);
    console.log(`Decrypted with chatId: "${decrypt(data.text, chatId)}"`);
    console.log(`Decrypted without chatId: "${decrypt(data.text)}"`);
    console.log(`---`);
  }
}

run().catch(console.error);
