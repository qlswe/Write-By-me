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
      
      const decrypted = decrypt(data.text, chatId);
      
      if (
        data.text.includes("nYp5LB+k") || 
        data.text.includes("NdFjUM=") || 
        decrypted.includes("nYp5LB+k") || 
        decrypted.includes("NdFjUM=") ||
        decrypted.includes("") ||
        decrypted.includes("Т ЬБТБЬТ")
      ) {
        console.log(`\n=== Found Weird Message in Chat: ${chatId} ===`);
        console.log(`Msg ID: ${msgDoc.id}`);
        console.log(`Sender: ${data.senderId}`);
        console.log(`Raw: "${data.text}"`);
        console.log(`Decrypted: "${decrypted}"`);
      }
    }
  }
}

run().catch(console.error);
