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

    const {
      email,
      amount,
      plan,
      firstName,
      lastName,
      platform,
      callback_url,
      company_name,
      company_size,
      job_title,
    } = await req.json()

    if (!email || !amount || !plan) {
      throw new Error('Missing required fields')
    }

    const reference = `TW_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    const callbackUrl = callback_url || 'https://taxwise.com.ng/payment-callback.html'

    const paystackPayload = {
      email,
      amount: amount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        user_id: user.id,
        plan,
        firstName,
        lastName,
        platform: platform || 'mobile',
        company_name,
        company_size,
        job_title,
      },
    }

    console.log('Initializing payment with Paystack:', {
      reference,
      email,
      amount,
      plan,
      callback_url: callbackUrl,
    })

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('Paystack initialization failed:', paystackData)
      throw new Error(paystackData.message || 'Payment initialization failed')
    }

    console.log('Payment initialized successfully:', reference)

    return new Response(
      JSON.stringify(paystackData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Initialize payment error:', error)
    return new Response(
      JSON.stringify({
        status: false,
        message: error.message,
        error: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
