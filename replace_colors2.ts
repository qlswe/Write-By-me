import fs from 'fs';
import path from 'path';

const replacements = {
  'rgba(195,166,230': 'rgba(255,77,77',
  'rgba(195, 166, 230': 'rgba(255, 77, 77',
  'rgba(224, 187, 228': 'rgba(255, 183, 3',
  '#B396D6': '#ff7a7a',
  '#B094EB': '#ff7a7a',
  '#1A1625': '#0d0b14',
  '#1c1528': '#251c35', // Lighter panel color
};

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      for (const [oldVal, newVal] of Object.entries(replacements)) {
        if (content.includes(oldVal)) {
          content = content.split(oldVal).join(newVal);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

walkDir('./src');
