import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { action } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Map the dashboard action to a signal the cBot understands
  const signalValue = action === 'start' 
    ? { action: 'none', status: 'active' } 
    : { action: 'none', status: 'paused' };

  const { error } = await supabase
    .from('bot_signals')
    .update({ 
        current_signal: signalValue,
        updated_at: new Date().toISOString() 
    })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
