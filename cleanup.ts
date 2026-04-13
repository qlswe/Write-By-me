import fs from 'fs';
import path from 'path';

const translationsPath = path.join(process.cwd(), 'src/data/translations.ts');
let content = fs.readFileSync(translationsPath, 'utf8');

// Remove all lines containing "Translation missing"
content = content.split('\n').filter(line => !line.includes('"Translation missing"')).join('\n');

fs.writeFileSync(translationsPath, content, 'utf8');
console.log('Cleaned up Translation missing lines');
