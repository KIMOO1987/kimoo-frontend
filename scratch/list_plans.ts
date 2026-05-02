import { supabase } from '../src/lib/supabaseClient';

async function listPlans() {
  const { data, error } = await supabase.from('plans').select('*');
  if (error) {
    console.error('Error fetching plans:', error);
    return;
  }
  console.log('Plans:', JSON.stringify(data, null, 2));
}

listPlans();
