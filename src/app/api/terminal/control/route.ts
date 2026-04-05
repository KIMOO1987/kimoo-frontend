import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    // Using the modern SSR client to avoid the base64 parsing error
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The setAll method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { action } = await req.json();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const signalValue = action === 'start' 
      ? { action: 'none', status: 'active' } 
      : { action: 'none', status: 'paused' };

    const { error: dbError } = await supabase
      .from('bot_signals')
      .update({ 
          current_signal: signalValue,
          updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Control API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
