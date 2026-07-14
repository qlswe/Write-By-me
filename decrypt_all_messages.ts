import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import { decrypt } from './src/utils/encryption';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  const chatId = "riwEcrLjeof6wg6PDIA9KZbdUGh2_vcxpskwzHZgVYjWdtfHm27F5Way2";
  const messagesSnap = await getDocs(collection(db, 'chats', chatId, 'messages'));
  console.log(`=== Messages in ${chatId} ===`);
  let successCount = 0;
  let failCount = 0;
  
  for (const doc of messagesSnap.docs) {
    const data = doc.data();
    if (!data.text) continue;
    
    const dec = decrypt(data.text, chatId);
    const isSuccess = dec !== data.text;
    
    if (isSuccess) {
      successCount++;
      console.log(`[OK] ID: ${doc.id} -> "${dec}"`);
    } else {
      failCount++;
      console.log(`[FAIL] ID: ${doc.id}`);
      console.log(`  Raw Text:  "${data.text}"`);
      // Let's also check if the delimiter is something else or what's inside
      const pipeIndex = data.text.indexOf('|');
      console.log(`  Pipe index: ${pipeIndex}`);
      if (pipeIndex === -1) {
        // Look for any other potential delimiter, or length
        console.log(`  No pipe found! Character at 25: "${data.text.charAt(25)}"`);
      }
    }
  }
  console.log(`\nDecryption Summary: Success: ${successCount}, Fail: ${failCount}`);
}

run().catch(console.error);
