import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Standard initialization for Next.js 15/16
    const supabase = createRouteHandlerClient({ cookies });
    
    const { action } = await req.json();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set the state in the database
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
