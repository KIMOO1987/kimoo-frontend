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
  // CRITICAL: You must implement a session check here to ensure the 
  // person calling this is actually an Admin or Moderator!
  
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
