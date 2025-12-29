import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { reference } = await req.json()
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY')

    // 1. Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    })
    const verifyData = await verifyRes.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      throw new Error('Transaction not successful')
    }

    const { metadata, amount, customer } = verifyData.data
    const userId = metadata.user_id
    const plan = metadata.plan

    // 2. Init Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Update Transaction to Success
    await supabaseAdmin.from('payment_transactions')
      .update({ 
        status: 'success', 
        paid_at: new Date().toISOString(),
        metadata: verifyData.data 
      })
      .eq('reference', reference)

    // 4. Update/Create Subscription
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30) // 30 Days

    await supabaseAdmin.from('api_subscriptions').upsert({
      user_id: userId,
      tier: plan,
      status: 'active',
      amount: amount / 100,
      currency: 'NGN',
      paystack_customer_code: customer.customer_code,
      current_period_end: expiry.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    // 5. CRITICAL: Activate Profile (Unlocks Dashboard)
    await supabaseAdmin.from('profiles')
      .update({ onboarding_status: 'active' })
      .eq('user_id', userId)

    return new Response(
      JSON.stringify({ status: true, message: 'Verified & Activated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ status: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
