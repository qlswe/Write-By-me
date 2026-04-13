import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
const content = fs.readFileSync(translationsPath, 'utf8');

// Extract the 'ru' object
const ruMatch = content.match(/ru:\s*\{([\s\S]*?)\},\n  en:/);
if (ruMatch) {
  const ruContent = ruMatch[1];
  const ruKeys = Array.from(ruContent.matchAll(/([a-zA-Z0-9_]+):/g)).map(m => m[1]);
  
  // Extract the 'en' object
  const enMatch = content.match(/en:\s*\{([\s\S]*?)\},\n  by:/);
  if (enMatch) {
    const enContent = enMatch[1];
    const enKeys = Array.from(enContent.matchAll(/([a-zA-Z0-9_]+):/g)).map(m => m[1]);
    
    const missingInEn = ruKeys.filter(key => !enKeys.includes(key));
    console.log('Keys missing in EN:', missingInEn);
  }
}
