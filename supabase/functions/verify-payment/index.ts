//supabase/functions/verify-payment/index.ts
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
    const amount = verifyData.data.amount / 100 // Convert from kobo to naira

    const now = new Date()
    const subscriptionEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))

    // ============================================
    // FIX: Update api_subscriptions table (not profiles)
    // ============================================
    const { error: subscriptionError } = await supabaseClient
      .from('api_subscriptions')
      .upsert({
        user_id: user.id,
        tier: plan,
        status: 'active',
        amount: amount,
        currency: 'NGN',
        current_period_start: now.toISOString(),
        current_period_end: subscriptionEnd.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (subscriptionError) {
      console.error('Subscription update error:', subscriptionError)
      throw new Error('Failed to update subscription: ' + subscriptionError.message)
    }

    console.log(`✅ api_subscriptions updated for user: ${user.id}`)

    // Also update profiles table for backward compatibility
    const { error: profileError } = await supabaseClient
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

    if (profileError) {
      console.error('Profile update error (non-critical):', profileError)
      // Don't throw error here since api_subscriptions is the primary table
    }

    console.log(`✅ profiles updated for user: ${user.id}`)

    // Update or insert payment transaction record
    const { error: paymentUpdateError } = await supabaseClient
      .from('payment_transactions')
      .update({
        status: 'success',
        paid_at: now.toISOString(),
      })
      .eq('paystack_reference', reference)

    if (paymentUpdateError) {
      console.error('Payment transaction update error:', paymentUpdateError)
      
      // If update failed, try insert (in case record doesn't exist)
      const { error: paymentInsertError } = await supabaseClient
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          paystack_reference: reference,
          amount: amount,
          currency: 'NGN',
          plan_type: plan,
          status: 'success',
          paid_at: now.toISOString(),
          created_at: now.toISOString(),
        })

      if (paymentInsertError) {
        console.error('Payment transaction insert error:', paymentInsertError)
      } else {
        console.log(`✅ payment_transactions record created`)
      }
    } else {
      console.log(`✅ payment_transactions updated`)
    }

    // Also keep old payments table for backward compatibility
    const { error: paymentsError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        reference: reference,
        amount: amount,
        currency: verifyData.data.currency,
        status: 'success',
        plan: plan,
        payment_method: verifyData.data.channel,
        metadata: verifyData.data,
        created_at: now.toISOString(),
      })

    if (paymentsError) {
      console.error('Payments table error (non-critical):', paymentsError)
    }

    console.log(`✅ Payment verified successfully for user: ${user.id}`)
    console.log(`📊 Subscription details: tier=${plan}, status=active, end=${subscriptionEnd.toISOString()}`)

    return new Response(
      JSON.stringify({
        status: true,
        message: 'Payment verified successfully',
        data: {
          user_id: user.id,
          subscription_status: 'active',
          subscription_tier: plan,
          subscription_end: subscriptionEnd.toISOString(),
          amount: amount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Verification error:', error)
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
