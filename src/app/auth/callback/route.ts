import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  
  if (code) {
    const cookieStore = await cookies()
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

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const { session } = data;
      
      // LOGIC: Check if the session was created specifically for recovery
      // This is the most reliable way to detect a password reset
      const isRecoveryFlow = 
        requestUrl.searchParams.get('type') === 'recovery' || 
        requestUrl.toString().includes('recovery') ||
        session.user?.recovery_sent_at !== null; // Optional: extra check

      if (isRecoveryFlow) {
        // Use a relative path to ensure Vercel handles it correctly
        return NextResponse.redirect(`${origin}/update-password`)
      }

      // Default redirect for signups/logins
      const next = requestUrl.searchParams.get('next') ?? '/dashboard'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If something went wrong, go back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}