// supabase/functions/get-signal/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query the 'signals' table for the most recent ACTIVE entry
    const { data, error } = await supabase
      .from('signals')
      .select('symbol, side, sl, tp, tp_secondary, status')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return new Response(JSON.stringify({ action: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Format the response for the C# cBot
    const responseBody = {
      symbol: data.symbol,
      action: data.side.toLowerCase(), // 'buy' or 'sell'
      sl: data.sl,
      tp: data.tp,
      status: data.status
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
