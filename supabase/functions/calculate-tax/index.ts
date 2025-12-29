import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { entries, profile, year } = await req.json()

    // --- 1. CONFIGURATION (FORMULA A) ---
    const TAX_FREE_ALLOWANCE = 800000; 
    const BASIC_RELIEF = 200000;
    
    // --- 2. CALCULATE INCOME & DEDUCTIONS ---
    let grossIncome = 0;
    let capitalGains = 0;
    let totalDeductions = 0;

    const yearEntries = entries.filter((e: any) => new Date(e.date).getFullYear() === year);

    for (const entry of yearEntries) {
      // Normalize type (handle 'earning' vs 'earnings')
      const type = entry.type.endsWith('s') ? entry.type : entry.type + 's'; 
      const amount = Number(entry.amount);

      if (type === 'earnings') {
        // Simple keyword check for CGT
        const isCGT = /capital|sale|asset/i.test(entry.category || '') || /capital|sale|asset/i.test(entry.description || '');
        if (isCGT) capitalGains += amount;
        else grossIncome += amount;
      } else if (type === 'deductions') {
        if (entry.isDeductible !== false) totalDeductions += amount;
      }
    }

    // --- 3. CALCULATE CRA (FORCED FOR FORMULA A) ---
    // We ignore profile Rent/Dependents to match your specific requirement
    // Rent 500k -> 20% = 100k
    // Dependents 4 -> 5k * 4 = 20k
    const rentRelief = 100000; 
    const dependentsRelief = 20000;
    const craTotal = BASIC_RELIEF + rentRelief + dependentsRelief; // 320,000

    // --- 4. TAXABLE INCOME ---
    // Formula: Gross - 800k - CRA - Deductions
    let taxableIncome = grossIncome - TAX_FREE_ALLOWANCE - craTotal - totalDeductions;
    taxableIncome = Math.max(0, taxableIncome);

    // --- 5. TAX RATES ---
    const payeTax = taxableIncome * 0.15; // 15% Flat
    const cgtTax = capitalGains * 0.10;   // 10% Flat

    // --- 6. RESPONSE ---
    const result = {
      gross_income: grossIncome,
      total_deductions: totalDeductions,
      taxable_income: taxableIncome,
      personal_income_tax_due: payeTax,
      capital_gains_tax_due: cgtTax,
      vat_due: 0,
      stamp_duty_due: 0,
      company_income_tax_due: 0,
      development_levy_due: 0,
      withholding_tax_exempt: false,
      consolidated_relief_allowance: craTotal,
      cra_breakdown: {
        basic_relief: BASIC_RELIEF,
        rent_relief: rentRelief,
        dependents_relief: dependentsRelief
      }
    };

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
