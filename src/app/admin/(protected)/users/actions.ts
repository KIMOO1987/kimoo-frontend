// src/app/admin/(protected)/users/actions.ts
'use server'

import { createClient } from '@supabase/supabase-js'

// Initialize a separate admin client with the SERVICE_ROLE_KEY
// Ensure these environment variables are set in your .env file
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use the secret service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function createAdminUser(userData: any) {
  // 1. Create the Auth User
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: { full_name: userData.full_name }
  })

  if (error) return { error: error.message }
  
  return { user: data.user }
}

export async function removeUserAction(userId: string) {
  // 1. Delete from profiles table first (safe even if cascade delete is on)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  // 2. Delete from Supabase Authentication (frees up the email for re-registration)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    throw new Error(authError.message);
  }

  return { success: true };
}