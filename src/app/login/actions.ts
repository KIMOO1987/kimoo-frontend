'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Redirect back with an error param
    redirect('/login?error=Invalid credentials')
  }

  // Forces a fresh server-side load of the dashboard
  redirect('/dashboard')
}

export async function requestPasswordReset(formData: FormData) {
  const cookieStore = await cookies()
  const email = formData.get('email') as string
  const origin = (await headers()).get('origin')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Handled by middleware */ }
        },
      },
    }
  )

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard/settings`,
  })

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/forgot-password?success=Instructions sent to email')
}

/**
 * Admin/Moderator manual reset logic.
 * This uses the Service Role Key to bypass user-facing flows.
 */
export async function adminForceResetPassword(userId: string, newPassword: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(...); // regular server client
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') throw new Error('Forbidden');
  
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Requires service_role key
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw error
  return data.user
}

/**
 * User submits a request for manual intervention
 */
export async function submitManualResetRequest(formData: FormData) {
  const cookieStore = await cookies()
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // No session needed for insert
      },
    }
  )

  // 1. Find the user ID by email (optional, helps tracking)
  const { data: userData } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  // 2. Insert request
  const { error } = await supabase
    .from('password_reset_requests')
    .insert({
      email,
      full_name: fullName || 'Unknown Trader',
      user_id: userData?.id || null,
      status: 'pending'
    });

  if (error) redirect('/forgot-password?error=Failed to submit request');

  redirect('/forgot-password?success=Support request sent. A moderator will contact you.');
}
