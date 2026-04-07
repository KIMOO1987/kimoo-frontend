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

    // --- STEP 1: VALIDATE USER (With Cleanup & Detailed Error) ---
    const cleanToken = botToken.trim(); 

    const { data: userProfile, error: userError } = await supabase
      .from('bot_signals')
      .select('is_active')
      .eq('bot_token', cleanToken)
      .maybeSingle();

    if (userError) {
        return new Response(JSON.stringify({ error: "DB_ERROR", details: userError.message }), { 
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (!userProfile) {
        return new Response(JSON.stringify({ error: "TOKEN_NOT_FOUND", token_received: cleanToken }), { 
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    if (userProfile.is_active !== true) {
        return new Response(JSON.stringify({ error: "SUBSCRIPTION_INACTIVE" }), { 
            status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // --- STEP 2: FETCH GLOBAL ACTIVE SIGNALS (JOINED WITH PROFILES) ---
    // We join the 'profiles' table to get 'grade' and 'category'
    const { data: trades, error: tradesError } = await supabase
      .from('signals')
      .select(`
        symbol, 
        side, 
        sl, 
        tp, 
        tp_secondary, 
        status, 
        is_active, 
        created_at,
        profiles!inner (
          grade,
          category
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (tradesError) throw tradesError;

    if (!trades || trades.length === 0) {
        return new Response(JSON.stringify([]), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }

    // --- STEP 3: MAP ACTIONS PER TRADE ---
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
            tp_secondary: trade.tp_secondary, // Renamed to match C# ExtractDouble key
            status: trade.status,
            // Accessing joined data from the profiles object
            grade: trade.profiles?.grade || "NORMAL",
            category: trade.profiles?.category || "FOREX",
            time: new Date(trade.created_at).getTime() 
        };
    });

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
