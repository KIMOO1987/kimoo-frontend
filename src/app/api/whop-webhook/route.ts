import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text(); // Get raw text for signature verification
    const signature = req.headers.get('x-whop-signature');

    // 1. SIGNATURE VERIFICATION (BSSE Best Practice)
    // Ensures the request actually came from Whop
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHOP_WEBHOOK_SECRET!)
      .update(bodyText)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 401 });
    }

    const { action, data } = JSON.parse(bodyText);

    // 2. ACTIVATE ACCESS
    if (action === 'membership.went_active') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: true, 
          plan_type: data.plan_id,
          updated_at: new Date() 
        })
        .eq('email', data.email);

      if (error) throw error;
      console.log(`✅ PRO Access Granted: ${data.email}`);
    }

    // 3. REVOKE ACCESS (Cancellations/Failed Payments)
    if (action === 'membership.went_invalid') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_pro: false, 
          plan_type: null,
          updated_at: new Date() 
        })
        .eq('email', data.email);

      if (error) throw error;
      console.log(`❌ PRO Access Revoked: ${data.email}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}