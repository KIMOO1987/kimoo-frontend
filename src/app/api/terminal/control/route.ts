import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

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
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    const { action, symbol, volume } = await req.json();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let signalValue;

    // Logic Switch for different Dashboard Actions
    switch (action) {
      case 'start':
        signalValue = { action: 'none', status: 'active' };
        break;
      case 'stop':
        signalValue = { action: 'none', status: 'paused' };
        break;
      case 'buy':
        signalValue = { 
            action: 'buy', 
            status: 'active', 
            symbol: symbol || 'BTCUSD', 
            volume: volume || 0.01,
            time: Math.floor(Date.now() / 1000) 
        };
        break;
      case 'sell':
        signalValue = { 
            action: 'sell', 
            status: 'active', 
            symbol: symbol || 'BTCUSD', 
            volume: volume || 0.01,
            time: Math.floor(Date.now() / 1000) 
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('bot_signals')
      .update({ 
          current_signal: signalValue,
          updated_at: new Date().toISOString() 
      })
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    return NextResponse.json({ 
        success: true, 
        message: `KIMOO PRO: ${action.toUpperCase()} signal deployed.` 
    });

  } catch (err: any) {
    console.error("Control API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
