import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Auth')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error } = await supabaseClient.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const uid = user.id

    // DELETE ORDER MATTERS
    await admin.from('payment_transactions').delete().eq('user_id', uid)
    await admin.from('api_subscriptions').delete().eq('user_id', uid)
    await admin.from('tax_calculations').delete().eq('user_id', uid)
    await admin.from('entries').delete().eq('user_id', uid)
    await admin.from('invoices').delete().eq('user_id', uid)
    await admin.from('receipts').delete().eq('user_id', uid)
    await admin.from('profiles').delete().eq('user_id', uid)
    await admin.auth.admin.deleteUser(uid)

    return new Response(JSON.stringify({ message: 'Deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
