import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    const { reference } = await req.json()

    if (!reference) {
      throw new Error('Payment reference is required')
    }

    console.log(`Verifying payment for reference: ${reference}`)

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const verifyData = await verifyResponse.json()

    console.log('Paystack verification response:', JSON.stringify(verifyData))

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return new Response(
        JSON.stringify({
          status: false,
          message: 'Payment verification failed or payment not completed',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const metadata = verifyData.data.metadata || {}
    const plan = metadata.plan || 'individual'

    const now = new Date()
    const subscriptionEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        onboarding_status: 'active',
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_start: now.toISOString(),
        subscription_end: subscriptionEnd.toISOString(),
        last_payment_date: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      throw new Error('Failed to update profile: ' + updateError.message)
    }

    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        reference: reference,
        amount: verifyData.data.amount / 100,
        currency: verifyData.data.currency,
        status: 'success',
        plan: plan,
        payment_method: verifyData.data.channel,
        metadata: verifyData.data,
        created_at: now.toISOString(),
      })

    if (paymentError) {
      console.error('Payment record error:', paymentError)
    }

    console.log(`Payment verified successfully for user: ${user.id}`)

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Payment verified successfully',
        data: {
          subscription_status: 'active',
          subscription_end: subscriptionEnd.toISOString(),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({
        status: false,
        message: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
