const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/Project/Testing/kimoo-frontend/.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');
const key = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('signals').select('*').limit(1);
  console.log('Signals table:', data, error);
}

test();
