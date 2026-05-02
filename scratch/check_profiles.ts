import { supabase } from '../src/lib/supabaseClient';

async function checkProfileColumns() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in profiles table:', Object.keys(data[0]));
  } else {
    console.log('Profiles table is empty or could not retrieve column names.');
  }
}

checkProfileColumns();
