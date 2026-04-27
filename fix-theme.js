const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/DashboardClient.tsx',
  'src/app/dashboard/active/page.tsx',
  'src/app/dashboard/history/page.tsx',
  'src/app/dashboard/signals/page.tsx',
  'src/app/dashboard/radar/page.tsx',
  'src/app/dashboard/audit/page.tsx',
  'src/app/dashboard/backtest/page.tsx',
  'src/app/dashboard/performance/page.tsx',
  'src/app/dashboard/profile/ProfileClient.tsx',
  'src/app/dashboard/payments/page.tsx',
  'src/app/payments/PaymentClient.tsx',
  'src/app/dashboard/mt5/page.tsx',
  'src/app/dashboard/ctrader/page.tsx',
  'src/app/dashboard/binance/page.tsx',
  'src/app/dashboard/okx/page.tsx',
  'src/app/dashboard/mexc/page.tsx',
  'src/app/dashboard/kraken/page.tsx',
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${file} - not found`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove dark backgrounds
  content = content.replace(/bg-\[#030407\]/g, '');
  content = content.replace(/bg-\[#050505\]/g, '');
  content = content.replace(/bg-\[#05070a\]/g, '');
  
  // Replace card backgrounds with theme-aware variables
  content = content.replace(/bg-\[#0a0a0a\]/g, 'bg-[var(--input-bg)]');
  content = content.replace(/bg-black/g, 'bg-[var(--input-bg)]');
  
  // Replace borders
  content = content.replace(/border-white\/5/g, 'border-[var(--glass-border)]');
  content = content.replace(/border-white\/10/g, 'border-[var(--glass-border)]');
  content = content.replace(/border-white\/\[0\.05\]/g, 'border-[var(--glass-border)]');
  content = content.replace(/border-white\/\[0\.08\]/g, 'border-[var(--glass-border)]');
  
  // Replace subtle white backgrounds
  content = content.replace(/bg-white\/\[0\.01\]/g, 'bg-[var(--glass-bg)]');
  content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-[var(--glass-bg)]');
  content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-[var(--glass-bg)]');
  content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-[var(--glass-bg)]');
  
  // Safely replace text-white -> dark:text-white text-zinc-900 (except in buttons)
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    // If the line has a strong colored background, don't change text-white
    if (line.match(/bg-(blue|red|emerald|orange|green|indigo|zinc)-[56]00/) || line.match(/btn-modern/)) {
      return line;
    }
    // Replace text-white with inherited or explicitly dark/light
    return line.replace(/\btext-white\b/g, 'text-zinc-900 dark:text-white');
  });
  content = newLines.join('\n');
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${file}`);
});
