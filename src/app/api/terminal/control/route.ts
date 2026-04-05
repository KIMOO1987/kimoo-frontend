import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // FIX: Await cookies first in Next.js 16
    const cookieStore = await cookies();
    
    // Pass the resolved store to the Supabase client
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const { action } = await req.json();
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine signal status based on dashboard button
    const signalValue = action === 'start' 
      ? { action: 'none', status: 'active' } 
      : { action: 'none', status: 'paused' };

    // Update database
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
