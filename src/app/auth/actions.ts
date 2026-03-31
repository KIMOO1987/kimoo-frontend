'use client' // If using this in a client component, or remove if using as Server Actions
import { createBrowserClient } from '@supabase/ssr'

export async function signOut() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  await supabase.auth.signOut()
  window.location.href = '/login'
}