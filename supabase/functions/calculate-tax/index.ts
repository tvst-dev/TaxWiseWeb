// Force deploy - v2.1 - Formula A (Fixes applied)
// Updated: 2025-01-15
// supabase/functions/calculate-tax/index.ts

// @ts-expect-error: Deno runtime imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error: Supabase runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface Entry {
  id: string;
  userId: string;
  type: 'earnings' | 'deductions' | 'earning' | 'deduction';
  amount: number;
  category: string;
  description: string | null;
  date: string;
  isExempt?: boolean;
  isRecurring?: boolean;
  isDeductible?: boolean;
  createdAt: string;
}

interface Profile {
  id: string;
  userId: string;
  fullName?: string;
  tin?: string;
  isResident: boolean;
  maritalStatus: string;
  numberOfDependents?: number;
  annualRentPaid?: number;
  number_of_dependents?: number;  // snake_case support
  annual_rent_paid?: number;       // snake_case support
  address?: string;
  phoneNumber?: string;
  occupation?: string;
  createdAt: string;
}

interface TaxCalculationRequest {
  entries: Entry[];
  profile: Profile;
  year?: number;
  subscriptionTier?: string;
}

interface TaxResult {
  taxable_income: number;
  gross_income: number;
  total_deductions: number;
  consolidated_relief_allowance: number;
  cra_breakdown: {
    basic_relief: number;
    rent_relief: number;
    dependents_relief: number;
  };
  personal_income_tax_due: number;
  capital_gains_tax_due: number;
  vat_due: number;
  stamp_duty_due: number;
  company_income_tax_due: number;
  development_levy_due: number;
  withholding_tax_exempt: boolean;
  tax_computation_details: any;
}

// Constants
const TAX_FREE_ALLOWANCE = 800000; // ₦800k tax-free allowance
const BASIC_RELIEF = 200000;       // ₦200k basic relief for everyone

// ============================================
// HELPER FUNCTIONS
// ============================================

function normalizeType(type: string): string {
  if (type === 'earning') return 'earnings';
  if (type === 'deduction') return 'deductions';
  return type;
}

function isCapitalGain(entry: Entry): boolean {
  const category = entry.category.toLowerCase();
  const description = (entry.description || '').toLowerCase();
  
  const capitalGainKeywords = [
    'capital gain', 'capital', 'asset sale', 'property sale', 
    'stock sale', 'investment sale', 'shares', 'house-sale', 'vehicle-sale'
  ];
  
  return capitalGainKeywords.some(keyword => 
    category.includes(keyword) || description.includes(keyword)
  );
}

// ============================================
// SAFE CRA CALCULATION (Works for all profiles)
// ============================================

function calculateCRA(grossIncome: number, profile: Profile) {
  console.log('=== CALCULATING CRA ===');
  console.log(`Gross Income: ₦${grossIncome.toLocaleString()}`);

  // Support both camelCase and snake_case
  const dependents = profile.numberOfDependents ?? profile.number_of_dependents ?? 0;
  const annualRent = profile.annualRentPaid ?? profile.annual_rent_paid ?? 0;

  console.log(`Profile Dependents: ${dependents}`);
  console.log(`Profile Rent: ₦${annualRent.toLocaleString()}`);

  // 1. Basic Relief: ₦200,000 (everyone gets this)
  const basicRelief = BASIC_RELIEF;
  console.log(`Basic Relief: ₦${basicRelief.toLocaleString()}`);

  // 2. Rent Relief: 20% of rent (capped at ₦100,000)
  const rentRelief = Math.min(annualRent * 0.20, 100000);
  console.log(`Rent Relief: 20% of ₦${annualRent.toLocaleString()} = ₦${rentRelief.toLocaleString()}`);

  // 3. Dependents Relief: ₦5,000 per dependent (max 4)
  const validDependents = Math.min(Math.max(0, dependents), 4);
  const dependentsRelief = validDependents * 5000;
  console.log(`Dependents Relief: ${validDependents} × ₦5,000 = ₦${dependentsRelief.toLocaleString()}`);

  const total = basicRelief + rentRelief + dependentsRelief;
  console.log(`TOTAL CRA: ₦${total.toLocaleString()}`);

  return {
    basic_relief: basicRelief,
    rent_relief: rentRelief,
    dependents_relief: dependentsRelief,
    total: total,
  };
}

// ============================================
// TAX CALCULATION - PM'S FORMULA A
// ============================================

function calculateTaxFormulaA(taxableIncome: number) {
  console.log('=== CALCULATING TAX (FORMULA A) ===');
  console.log(`Taxable Income: ₦${taxableIncome.toLocaleString()}`);

  // Flat 15% rate for taxable income in this bracket
  const taxRate = 0.15;
  const tax = taxableIncome * taxRate;
  
  console.log(`Tax Rate: ${taxRate * 100}%`);
  console.log(`Tax Amount: ₦${tax.toLocaleString()}`);

  return {
    total: tax,
    rate: taxRate,
    calculation: `₦${taxableIncome.toLocaleString()} × ${taxRate * 100}% = ₦${tax.toLocaleString()}`
  };
}

// ============================================
// INDIVIDUAL TAX CALCULATION (FORMULA A)
// ============================================

function calculateIndividualTax(entries: Entry[], profile: Profile, year: number): TaxResult {
  console.log('\n========================================');
  console.log('TAX CALCULATION - FORMULA A');
  console.log('========================================');
  
  // Filter entries for selected year
  const yearEntries = entries.filter(entry => {
    const entryYear = new Date(entry.date).getFullYear();
    return entryYear === year;
  });
  
  console.log(`Year: ${year}`);
  console.log(`Entries for year ${year}: ${yearEntries.length}`);

  // Step 1: Calculate Gross Income and Capital Gains
  let grossIncome = 0;
  let capitalGains = 0;

  console.log('\n--- EARNINGS ---');
  for (const entry of yearEntries) {
    const type = normalizeType(entry.type);
    
    if (type === 'earnings') {
      if (isCapitalGain(entry)) {
        capitalGains += entry.amount;
        console.log(`Capital Gain: ₦${entry.amount.toLocaleString()}`);
      } else {
        grossIncome += entry.amount;
        console.log(`Income: ₦${entry.amount.toLocaleString()}`);
      }
    }
  }

  console.log(`\nTotal Gross Income: ₦${grossIncome.toLocaleString()}`);
  console.log(`Total Capital Gains: ₦${capitalGains.toLocaleString()}`);

  // Step 2: Calculate CRA (works even if profile has no CRA data)
  const cra = calculateCRA(grossIncome, profile);

  // Step 3: Calculate Total Deductions
  let totalDeductions = 0;
  
  console.log('\n--- DEDUCTIONS ---');
  for (const entry of yearEntries) {
    const type = normalizeType(entry.type);
    if (type === 'deductions' && entry.isDeductible !== false) {
      totalDeductions += entry.amount;
      console.log(`Deduction: ₦${entry.amount.toLocaleString()}`);
    }
  }
  console.log(`Total Deductions: ₦${totalDeductions.toLocaleString()}`);

  // Step 4: Calculate Taxable Income (PM'S FORMULA A)
  // Formula: Gross - ₦800k - CRA - Deductions
  const taxableIncome = Math.max(0, grossIncome - TAX_FREE_ALLOWANCE - cra.total - totalDeductions);
  
  console.log('\n=== FORMULA A CALCULATION ===');
  console.log(`Gross Income:              ₦${grossIncome.toLocaleString()}`);
  console.log(`Less: Tax-Free Allowance  (₦${TAX_FREE_ALLOWANCE.toLocaleString()})`);
  console.log(`Less: CRA                 (₦${cra.total.toLocaleString()})`);
  console.log(`  • Basic Relief           ₦${cra.basic_relief.toLocaleString()}`);
  console.log(`  • Rent Relief            ₦${cra.rent_relief.toLocaleString()}`);
  console.log(`  • Dependents Relief      ₦${cra.dependents_relief.toLocaleString()}`);
  console.log(`Less: Deductions          (₦${totalDeductions.toLocaleString()})`);
  console.log(`═══════════════════════════════════════`);
  console.log(`TAXABLE INCOME:            ₦${taxableIncome.toLocaleString()}`);

  // Step 5: Calculate PAYE Tax
  const payeTax = calculateTaxFormulaA(taxableIncome);

  // Step 6: Calculate CGT (if any)
  const cgtRate = 0.10;
  const cgtTax = capitalGains * cgtRate;
  
  if (capitalGains > 0) {
    console.log(`\nCapital Gains Tax: ₦${capitalGains.toLocaleString()} × 10% = ₦${cgtTax.toLocaleString()}`);
  }

  console.log('\n========================================');
  console.log('FINAL RESULTS');
  console.log('========================================');
  console.log(`Taxable Income:  ₦${taxableIncome.toLocaleString()}`);
  console.log(`PAYE Tax:        ₦${payeTax.total.toLocaleString()}`);
  console.log(`CGT Tax:         ₦${cgtTax.toLocaleString()}`);
  console.log(`Total Tax:       ₦${(payeTax.total + cgtTax).toLocaleString()}`);
  console.log('========================================\n');

  return {
    taxable_income: taxableIncome,
    gross_income: grossIncome,
    total_deductions: totalDeductions,
    consolidated_relief_allowance: cra.total,
    cra_breakdown: {
      basic_relief: cra.basic_relief,
      rent_relief: cra.rent_relief,
      dependents_relief: cra.dependents_relief,
    },
    personal_income_tax_due: payeTax.total,
    capital_gains_tax_due: cgtTax,
    vat_due: 0,
    stamp_duty_due: 0,
    company_income_tax_due: 0,
    development_levy_due: 0,
    withholding_tax_exempt: false,
    tax_computation_details: {
      formula: "A",
      tax_free_allowance: TAX_FREE_ALLOWANCE,
      tax_rate: payeTax.rate,
      calculation: payeTax.calculation,
      steps: {
        gross_income: grossIncome,
        tax_free_allowance: TAX_FREE_ALLOWANCE,
        cra: cra.total,
        deductions: totalDeductions,
        taxable_income: taxableIncome,
        tax: payeTax.total,
      }
    },
  };
}

// ============================================
// COMPANY TAX CALCULATION
// ============================================

function calculateCompanyTax(entries: Entry[], profile: Profile, year: number, subscriptionTier: string): TaxResult {
  console.log('=== COMPANY TAX CALCULATION ===');
  
  const yearEntries = entries.filter(entry => {
    const entryYear = new Date(entry.date).getFullYear();
    return entryYear === year;
  });

  let grossIncome = 0;
  let capitalGains = 0;

  for (const entry of yearEntries) {
    const type = normalizeType(entry.type);
    if (type === 'earnings') {
      if (isCapitalGain(entry)) {
        capitalGains += entry.amount;
      } else {
        grossIncome += entry.amount;
      }
    }
  }

  let totalDeductions = 0;
  for (const entry of yearEntries) {
    const type = normalizeType(entry.type);
    if (type === 'deductions' && entry.isDeductible !== false) {
      totalDeductions += entry.amount;
    }
  }

  const assessableProfits = Math.max(0, grossIncome - totalDeductions);

  const isSmallCompany = grossIncome <= 100000000;
  const isStartup = subscriptionTier === 'startup';

  let citRate = 0.30;
  if (isSmallCompany || isStartup) {
    citRate = 0.0;
  }

  let citTax = assessableProfits * citRate;

  let developmentLevy = 0;
  if (!isSmallCompany && !isStartup) {
    developmentLevy = assessableProfits * 0.04;
  }

  if (grossIncome >= 50000000000) {
    const effectiveTaxRate = (citTax + developmentLevy) / Math.max(1, assessableProfits);
    if (effectiveTaxRate < 0.15) {
      citTax += (0.15 - effectiveTaxRate) * assessableProfits;
    }
  }

  const cgtTax = isSmallCompany ? 0 : capitalGains * 0.30;
  const whtExempt = isSmallCompany || isStartup;

  return {
    taxable_income: assessableProfits,
    gross_income: grossIncome,
    total_deductions: totalDeductions,
    consolidated_relief_allowance: 0,
    cra_breakdown: {
      basic_relief: 0,
      rent_relief: 0,
      dependents_relief: 0,
    },
    personal_income_tax_due: 0,
    capital_gains_tax_due: cgtTax,
    vat_due: 0,
    stamp_duty_due: 0,
    company_income_tax_due: citTax,
    development_levy_due: developmentLevy,
    withholding_tax_exempt: whtExempt,
    tax_computation_details: {
      is_small_company: isSmallCompany,
      is_startup: isStartup,
      cit_rate: citRate,
    },
  };
}

// ============================================
// API KEY VALIDATION
// ============================================

async function validateApiKey(apiKey: string): Promise<{ valid: boolean }> {
  if (!apiKey) return { valid: false };

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, subscription_tier, is_active, requests_this_month')
    .eq('key_hash', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !data) return { valid: false };

  const limits = { free: 1000, pro: 10000, enterprise: 100000 };
  const monthlyLimit = limits[data.subscription_tier as keyof typeof limits] || limits.free;
  
  if (data.requests_this_month >= monthlyLimit) return { valid: false };

  await supabase
    .from('api_keys')
    .update({ 
      requests_this_month: data.requests_this_month + 1,
      last_used_at: new Date().toISOString()
    })
    .eq('id', data.id);

  return { valid: true };
}

// ============================================
// MAIN SERVE FUNCTION
// ============================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const authHeader = req.headers.get('Authorization');
    const isInternalCall = authHeader && authHeader.startsWith('Bearer ');

    // Authentication
    if (isInternalCall) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );

      const token = authHeader.replace('Bearer ', '');
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      // ⭐️ MODIFICATION 1: Allow Anon Key to bypass user check for debugging
      // If the token sent IS the Anon Key, we skip the getUser() check
      const isAnonKey = token === anonKey;

      if (!isAnonKey) {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication token' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else if (apiKey) {
      const validation = await validateApiKey(apiKey);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid or rate-limited API key' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'API key or authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body: TaxCalculationRequest = await req.json();

    if (!body.entries || !Array.isArray(body.entries)) {
      return new Response(
        JSON.stringify({ error: 'Valid entries array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.profile) {
      return new Response(
        JSON.stringify({ error: 'Valid profile object required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const year = body.year || new Date().getFullYear();
    const subscriptionTier = body.subscriptionTier || 'individual';

    console.log(`\n🔷 Tax Calculation (FORMULA A)`);
    console.log(`Year: ${year}, Tier: ${subscriptionTier}`);

    // Calculate tax
    let result: TaxResult;

    if (subscriptionTier === 'individual') {
      result = calculateIndividualTax(body.entries, body.profile, year);
    } else {
      result = calculateCompanyTax(body.entries, body.profile, year, subscriptionTier);
    }

    // ⭐️ MODIFICATION 2: Added Cache-Control Headers to prevent persistence issues
    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Prevents Edge caching so your new formula always runs
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
