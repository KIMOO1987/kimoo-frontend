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

    // 1. Fetch ALL active trades for this user (Removed .limit(1))
    const { data: trades, error } = await supabase
      .from('signals')
      .select('symbol, side, sl, tp, tp_secondary, status, is_active, created_at')
      .eq('bot_token', botToken)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!trades || trades.length === 0) {
        return new Response(JSON.stringify({ action: "none" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Map through all active trades to build a list of actions
    const responseBody = trades.map(trade => {
        let action = "none";
        const status = trade.status?.toUpperCase();

        if (status === "PENDING" || status === "ENTRY") {
            action = trade.side.toLowerCase(); 
        } else if (status === "TP1") {
            action = "partial_close";
        } else if (status === "TP2" || status === "SL" || status === "TP1 + SL (BE)") {
            action = "close_all";
        }

        return {
            action: action,
            symbol: trade.symbol,
            sl: trade.sl,
            tp: trade.tp,
            tp2: trade.tp_secondary,
            status: trade.status,
            time: new Date(trade.created_at).getTime() // Send timestamp as unique ID
        };
    });

    // 3. Return the array of signals
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
