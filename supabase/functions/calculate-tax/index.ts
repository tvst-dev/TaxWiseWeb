import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { entries, profile, year } = await req.json()

    // --- 1. CONSTANTS (2026 Rules) ---
    const TAX_FREE_ALLOWANCE = 800000; 
    const BASIC_RELIEF = 200000;       
    
    // --- 2. CALCULATE GROSS INCOME ---
    let grossIncome = 0;
    let capitalGains = 0;
    let totalDeductions = 0;

    const yearEntries = entries.filter((e: any) => new Date(e.date).getFullYear() === year);

    for (const entry of yearEntries) {
      const type = entry.type.endsWith('s') ? entry.type : entry.type + 's'; 
      const amount = Number(entry.amount);

      if (type === 'earnings') {
        // CGT Check
        const isCGT = /capital|sale|asset/i.test(entry.category || '') || /capital|sale|asset/i.test(entry.description || '');
        if (isCGT) capitalGains += amount;
        else grossIncome += amount;
      } else if (type === 'deductions') {
        if (entry.isDeductible !== false) totalDeductions += amount;
      }
    }

    // --- 3. CALCULATE CRA (Consolidated Relief Allowance) ---
    // Rule: Basic (200k) + Rent (20% of Rent paid, max 100k) + Dependents (5k each, max 4)
    
    const rentPaid = Number(profile?.annualRentPaid || profile?.annual_rent_paid || 0);
    const dependents = Number(profile?.numberOfDependents || profile?.number_of_dependents || 0);

    const rentRelief = Math.min(rentPaid * 0.20, 100000);
    const validDependents = Math.min(Math.max(0, dependents), 4);
    const dependentsRelief = validDependents * 5000;

    const craTotal = BASIC_RELIEF + rentRelief + dependentsRelief;

    // --- 4. TAXABLE INCOME ---
    // Formula: Gross - 800k (Tax Free) - CRA - Deductions
    let taxableIncome = grossIncome - TAX_FREE_ALLOWANCE - craTotal - totalDeductions;
    taxableIncome = Math.max(0, taxableIncome);

    // --- 5. TAX RATES (Progressive or Flat) ---
    // For "Formula A" (Standard 2026 Proposal for simplified tax):
    // Often cited as flat 15% for income above threshold, but can be progressive.
    // Implementing standard Flat 15% as per your Formula A request.
    const payeTax = taxableIncome * 0.15; 
    const cgtTax = capitalGains * 0.10;   

    const result = {
      gross_income: grossIncome,
      total_deductions: totalDeductions,
      taxable_income: taxableIncome,
      personal_income_tax_due: payeTax,
      capital_gains_tax_due: cgtTax,
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
