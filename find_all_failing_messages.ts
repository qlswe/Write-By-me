import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import { decrypt } from './src/utils/encryption';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatsSnap = await getDocs(collection(db, 'chats'));
  console.log(`Checking ${chatsSnap.docs.length} chats...`);
  
  for (const chatDoc of chatsSnap.docs) {
    const chatId = chatDoc.id;
    const subMsgs = await getDocs(collection(db, 'chats', chatId, 'messages'));
    
    for (const msgDoc of subMsgs.docs) {
      const data = msgDoc.data();
      if (!data.text) continue;
      
      const dec = decrypt(data.text, chatId);
      const isSuccess = dec !== data.text;
      
      if (!isSuccess && data.text.startsWith("AES_")) {
        console.log(`[FAIL] Chat: ${chatId}, Msg: ${msgDoc.id}`);
        console.log(`  Raw: "${data.text}"`);
        // Let's try parsing it manually
        if (data.text.includes("|")) {
          const payload = data.text.substring(data.text.indexOf(":") + 1);
          const parts = payload.split("|");
          const seed = parts[0];
          console.log(`  Seed: ${seed}`);
        } else {
          // Check for any other delimiter
          const match = data.text.match(/AES_V2_ROLLING:(\d{4}-\d{2}-\d{2})(.)(.*)/);
          if (match) {
            console.log(`  Regex match: delimiter is "${match[2]}"`);
          }
        }
      }
    }
  }
}

run().catch(console.error);
