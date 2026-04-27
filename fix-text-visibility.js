const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // Skip lines with primary button backgrounds to keep them white
    if (line.match(/bg-(blue|red|emerald|orange|green|indigo|zinc)-[56]00/) || line.match(/btn-modern/)) {
      return line;
    }
    
    // Replace text-zinc colors using negative lookbehind to avoid replacing inside dark: classes
    let l = line;
    l = l.replace(/(?<!dark:)text-zinc-200/g, 'text-zinc-900 dark:text-zinc-200');
    l = l.replace(/(?<!dark:)text-zinc-300/g, 'text-zinc-800 dark:text-zinc-300');
    l = l.replace(/(?<!dark:)text-zinc-400/g, 'text-zinc-700 dark:text-zinc-400');
    l = l.replace(/(?<!dark:)text-zinc-500/g, 'text-zinc-600 dark:text-zinc-500');
    
    // Replace opacity text-white like text-white/50
    l = l.replace(/(?<!dark:)text-white\/(\d+)/g, 'text-zinc-900/$1 dark:text-white/$1');
    
    // Also catch any raw text-white that was missed (e.g., in components)
    // Wait, let's only replace if it's not already handled
    // Replace `text-white` but only if it doesn't have dark: before it and no / after it
    l = l.replace(/(?<!dark:)text-white(?!\/\d+)(?! dark:)/g, 'text-zinc-900 dark:text-white');
    
    // Clean up any double replacements just in case
    l = l.replace(/text-zinc-900 dark:text-zinc-900 dark:text-white/g, 'text-zinc-900 dark:text-white');
    
    return l;
  });
  
  content = newLines.join('\n');
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

walkDir(path.join(process.cwd(), 'src/app'), processFile);
walkDir(path.join(process.cwd(), 'src/components'), processFile);

console.log('Fixed text visibility in all .tsx files');
