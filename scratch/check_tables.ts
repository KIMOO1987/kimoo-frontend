import { supabase } from './src/lib/supabaseClient';

async function listAllTables() {
  // This is a hacky way to guess tables
  const tables = ['plans', 'profiles', 'resets', 'staff', 'payments', 'trial_config', 'settings'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`Table '${table}' exists.`);
    } else {
      // console.log(`Table '${table}' does not exist or error:`, error.message);
    }
  }
}

listAllTables();
