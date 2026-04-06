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
    const url = new URL(req.url)
    const botToken = url.searchParams.get('botId')

    if (!botToken) throw new Error("Missing botId parameter")

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the latest active trade for this user
    const { data, error } = await supabase
      .from('signals')
      .select('symbol, side, sl, tp, tp_secondary, status, is_active')
      .eq('bot_token', botToken)
      .eq('is_active', true) // Only grab live trades
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return new Response(JSON.stringify({ action: "none" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // --- SMART LOGIC FOR TRADE PHASES ---
    let action = "none";
    
    if (data.status === "PENDING" || data.status === "ENTRY") {
        action = data.side.toLowerCase(); // 'buy' or 'sell' (Open New Trade)
    } 
    else if (data.status === "TP1") {
        action = "partial_close"; // Tell cBot to close 50% and move SL to BE
    }
    else if (data.status === "TP2" || data.status === "SL" || data.status === "TP1 + SL (BE)") {
        action = "close_all"; // Final Exit
    }

    const responseBody = {
      action: action,
      symbol: data.symbol,
      sl: data.sl,
      tp: data.tp,
      tp2: data.tp_secondary, // Added support for TP2
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
