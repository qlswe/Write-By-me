const fs = require('fs');
let content = fs.readFileSync('src/data/translations.ts', 'utf8');
content = content.replace(/\s*jp: \{[\s\S]*?\n  \},/, '');
fs.writeFileSync('src/data/translations.ts', content);

let content2 = fs.readFileSync('src/data/content.ts', 'utf8');
content2 = content2.replace(/\s*jp: string;/g, '');
content2 = content2.replace(/\s*jp: ".*?",/g, '');
fs.writeFileSync('src/data/content.ts', content2);

let content3 = fs.readFileSync('src/components/ui/DailyFortune.tsx', 'utf8');
content3 = content3.replace(/, jp: ".*?"/g, '');
fs.writeFileSync('src/components/ui/DailyFortune.tsx', content3);
