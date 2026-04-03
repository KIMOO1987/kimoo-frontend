// app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Hardcode your production URL as a fallback if origin is weird
  const origin = requestUrl.origin; 
  const type = requestUrl.searchParams.get('type');

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If the URL contains 'recovery' or 'type=recovery', force them to the update page
      if (type === 'recovery' || requestUrl.toString().includes('recovery')) {
        return NextResponse.redirect(`${origin}/update-password`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // If there is an error, check what it is
  return NextResponse.redirect(`${origin}/login?error=session_not_created`)
}
