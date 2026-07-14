import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import { decrypt } from './src/utils/encryption';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatsSnap = await getDocs(collection(db, 'chats'));
  console.log(`Checking lastMessage for ${chatsSnap.docs.length} chats...`);
  
  for (const chatDoc of chatsSnap.docs) {
    const data = chatDoc.data();
    if (!data.lastMessage) continue;
    
    const dec = decrypt(data.lastMessage, chatDoc.id);
    const isSuccess = dec !== data.lastMessage;
    
    if (!isSuccess && data.lastMessage.startsWith("AES_")) {
      console.log(`[FAIL] Chat: ${chatDoc.id}`);
      console.log(`  Raw Last Message: "${data.lastMessage}"`);
    } else {
      console.log(`[OK] Chat: ${chatDoc.id} -> "${dec}"`);
    }
  }
}

run().catch(console.error);
