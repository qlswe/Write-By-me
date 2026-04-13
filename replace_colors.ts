import fs from 'fs';
import path from 'path';

const replacements = {
  '#1a142e': '#0d0b14',
  '#3E3160': '#1c1528',
  '#2F244F': '#15101e',
  '#5C4B8B': '#3d2b4f',
  '#C3A6E6': '#ff4d4d',
  '#E0BBE4': '#ffb703',
};

function walkDir(dir) {
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
