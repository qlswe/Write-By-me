import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

const ruMatch = content.match(/ru:\s*\{([\s\S]*?)\},\n  en:/);
if (!ruMatch) throw new Error('Could not find ru translations');

const ruContent = ruMatch[1];
const ruKeys = Array.from(ruContent.matchAll(/([a-zA-Z0-9_]+):\s*"/g)).map(m => m[1]);

const langs = ['en', 'by', 'de', 'fr', 'zh'];

for (const lang of langs) {
  const langRegex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(    characters:\\s*{[\\s\\S]*?    \\}\\n  \\})`, 'g');
  content = content.replace(langRegex, (match, p1, p2) => {
    let newProps = '';
    for (const key of ruKeys) {
      if (!p1.includes(`    ${key}:`)) {
        console.log(`Missing key ${key} in ${lang}`);
        // Let's just add it with English translation if available, or Russian
        const enMatch = content.match(new RegExp(`en:\\s*\\{[\\s\\S]*?    ${key}:\\s*"(.*?)"`));
        const ruMatch = content.match(new RegExp(`ru:\\s*\\{[\\s\\S]*?    ${key}:\\s*"(.*?)"`));
        const val = enMatch ? enMatch[1] : (ruMatch ? ruMatch[1] : "Missing");
        newProps += `    ${key}: "${val}",\n`;
      }
    }
    return p1 + newProps + p2;
  });
}

fs.writeFileSync(translationsPath, content, 'utf8');
console.log('Added missing keys');
