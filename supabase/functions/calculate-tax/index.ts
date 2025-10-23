import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface TaxCalculationRequest {
  income: number;
  deductions?: number;
  year?: number;
}

interface TaxCalculationResponse {
  income: number;
  deductions: number;
  taxableIncome: number;
  estimatedTax: number;
  taxRate: number;
  breakdown: {
    bracket: string;
    rate: number;
    amount: number;
  }[];
}

// Nigeria 2025 Tax Brackets
const TAX_BRACKETS = [
  { max: 300000, rate: 0.07, name: "First ₦300,000" },
  { max: 300000, rate: 0.11, name: "Next ₦300,000" },
  { max: 500000, rate: 0.15, name: "Next ₦500,000" },
  { max: 500000, rate: 0.19, name: "Next ₦500,000" },
  { max: 1600000, rate: 0.21, name: "Next ₦1,600,000" },
  { max: Infinity, rate: 0.24, name: "Above ₦3,200,000" }
];

function calculateNigeriaTax(income: number, deductions: number = 0): TaxCalculationResponse {
  const taxableIncome = Math.max(0, income - deductions);
  let remainingIncome = taxableIncome;
  let totalTax = 0;
  const breakdown = [];

  for (const bracket of TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableAtThisRate = Math.min(remainingIncome, bracket.max);
    const taxAtThisRate = taxableAtThisRate * bracket.rate;
    
    totalTax += taxAtThisRate;
    remainingIncome -= taxableAtThisRate;

    breakdown.push({
      bracket: bracket.name,
      rate: bracket.rate,
      amount: taxAtThisRate
    });
  }

  return {
    income,
    deductions,
    taxableIncome,
    estimatedTax: totalTax,
    taxRate: taxableIncome > 0 ? (totalTax / taxableIncome) : 0,
    breakdown
  };
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; keyId?: string; tier?: string }> {
  if (!apiKey) {
    return { valid: false };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Hash the API key (in production, use proper hashing)
  const keyHash = apiKey;

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, subscription_tier, is_active, requests_this_month, rate_limit_per_minute')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.log('API key validation failed:', error);
    return { valid: false };
  }

  // Check rate limits based on tier
  const limits = {
    free: 1000,
    pro: 10000,
    enterprise: 100000
  };

  const monthlyLimit = limits[data.subscription_tier as keyof typeof limits] || limits.free;
  
  if (data.requests_this_month >= monthlyLimit) {
    return { valid: false };
  }

  // Update usage
  await supabase
    .from('api_keys')
    .update({ 
      requests_this_month: data.requests_this_month + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', data.id);

  // Log usage
  await supabase
    .from('api_usage')
    .insert({
      api_key_id: data.id,
      endpoint: '/calculate-tax',
      request_count: 1,
      status_code: 200
    });

  return { 
    valid: true, 
    keyId: data.id,
    tier: data.subscription_tier
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required. Get your key at https://taxwise.app/developer' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid or rate-limited API key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: TaxCalculationRequest = await req.json();

    if (!body.income || body.income < 0) {
      return new Response(
        JSON.stringify({ error: 'Valid income amount required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate tax
    const result = calculateNigeriaTax(body.income, body.deductions || 0);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in calculate-tax function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
