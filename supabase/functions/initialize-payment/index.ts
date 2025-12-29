import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Get Auth User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Parse Body
    const { email, amount, plan, firstName, lastName, platform } = await req.json()
    
    // 3. Determine Callback URL
    // Web: Redirect to your React App callback page
    // Mobile: Redirect to Deep Link (taxwise://) OR standard close for WebView detection
    let callbackUrl = "https://standard.paystack.co/close"; 
    
    // If you are using the WebView "cancel detection" logic we built, standard close is best.
    // If you want explicit deep linking:
    // if (platform === 'mobile') callbackUrl = "taxwise://payment-callback";

    // 4. Call Paystack
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    const reference = `TW_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount, // Kobo
        reference,
        currency: 'NGN',
        callback_url: callbackUrl, 
        metadata: {
          plan,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName
        }
      })
    })

    const data = await paystackRes.json()
    if (!data.status) throw new Error(data.message)

    // 5. Record Transaction (Pending)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseAdmin.from('payment_transactions').insert({
      user_id: user.id,
      reference,
      amount: amount / 100, // Naira
      status: 'pending',
      plan_type: plan,
      metadata: { platform }
    })

    return new Response(
      JSON.stringify({ status: true, data: { authorization_url: data.data.authorization_url, reference } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ status: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
