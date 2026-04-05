import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const botId = url.searchParams.get('botId')

  if (!botId) {
    return new Response(JSON.stringify({ error: 'No botId provided' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  // Create Supabase client with Service Role Key to bypass RLS for this specific read
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Fetch the signal for this specific bot_token
  const { data, error } = await supabase
    .from('bot_signals')
    .select('current_signal')
    .eq('bot_token', botId)
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ action: 'none', message: 'Invalid ID' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }

  // Return the signal to the cBot
  return new Response(
    JSON.stringify(data.current_signal),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})