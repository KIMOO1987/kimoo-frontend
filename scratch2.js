const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('d:/Project/Testing/kimoo-frontend/.env.local', 'utf-8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim().replace(/^['"]|['"]$/g, '');
const key = keyMatch[1].trim().replace(/^['"]|['"]$/g, '');

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.rpc('get_paginated_signals', {
    p_user_id: 'test',
    p_search: '',
    p_asset_class: 'ALL',
    p_date_from: null,
    p_date_to: null,
    p_page: 1,
    p_page_size: 12
  });
  console.log('RPC result:', data, error);
}

test();
