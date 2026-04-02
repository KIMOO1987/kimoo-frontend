import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // MUST BE TRUE
    storageKey: '3520272430929abcKIMOO', // Custom key to avoid conflicts
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
