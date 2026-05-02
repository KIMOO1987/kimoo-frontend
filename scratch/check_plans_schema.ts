import { supabase } from '../src/lib/supabaseClient';

async function checkPlansColumns() {
  const { data, error } = await supabase.from('plans').select('*').limit(1);
  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in plans table:', Object.keys(data[0]));
    console.log('Sample plan:', data[0]);
  } else {
    console.log('Plans table is empty.');
  }
}

checkPlansColumns();
