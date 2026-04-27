const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir(path.join(process.cwd(), 'src/app'), (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Background replacements
    content = content.replace(/bg-\[#020305\]/g, 'bg-[var(--input-bg)]');
    content = content.replace(/bg-\[#030407\]/g, '');
    content = content.replace(/bg-\[#050505\]/g, '');
    content = content.replace(/bg-\[#05070a\]/g, '');
    content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-[var(--input-bg)]');
    
    // Some bg-black instances might be okay, but for cards they should be var(--input-bg)
    // We will target `bg-black` but be careful.
    content = content.replace(/bg-black/g, 'bg-[var(--input-bg)]');
    content = content.replace(/bg-zinc-950/g, 'bg-[var(--input-bg)]');
    
    // Replace text-white safely (skip strong backgrounds)
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      // Don't replace if line has primary colors
      if (line.match(/bg-(blue|red|emerald|orange|green|indigo|zinc)-[56]00/) || line.match(/btn-modern/)) {
        return line;
      }
      return line.replace(/\btext-white\b/g, 'text-zinc-900 dark:text-white');
    });
    
    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Fixed all .tsx files in src/app');
