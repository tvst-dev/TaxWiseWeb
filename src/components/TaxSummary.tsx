import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function TaxSummary({ entries, taxCalculations, onCalculationsChange }: any) {
  const [calculating, setCalculating] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [taxResults, setTaxResults] = useState<any>(null);
  
  const currentYear = new Date().getFullYear();

  // --- CALL EDGE FUNCTION ---
  const calculateTax = useCallback(async () => {
    setCalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;

      // 1. Fetch Profile for context (Rent/Dependents)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 2. Call Edge Function
      const { data, error } = await supabase.functions.invoke('calculate-tax', {
        body: { entries, profile, year: currentYear }
      });

      if (error) throw error;
      setTaxResults(data);

    } catch (e: any) {
      console.error(e);
      toast({ title: "Calculation Error", description: "Could not calculate tax.", variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  }, [entries, currentYear]);

  // Auto-calculate on load
  useEffect(() => {
    if(entries.length > 0) calculateTax();
  }, [entries, calculateTax]);

  const saveCalculation = async () => {
    if(!taxResults) return;
    setSavingCalculation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const totalTax = (taxResults.personal_income_tax_due || 0) + (taxResults.capital_gains_tax_due || 0);

      const payload = {
        user_id: user?.id,
        year: currentYear,
        total_earnings: taxResults.gross_income,
        total_deductions: taxResults.total_deductions,
        taxable_income: taxResults.taxable_income,
        estimated_tax_owed: totalTax,
        estimated_tax_rate: (totalTax / taxResults.taxable_income) * 100 || 0,
        calculation_name: `Tax Calc ${currentYear}`,
        tax_breakdown: taxResults // Save full JSON response
      };

      // Check existing
      const { data: existing } = await supabase.from('tax_calculations').select('id').eq('year', currentYear).maybeSingle();

      if(existing) {
         await supabase.from('tax_calculations').update(payload).eq('id', existing.id);
      } else {
         await supabase.from('tax_calculations').insert(payload);
      }

      toast({ title: "Saved", description: "Calculation saved to history" });
      onCalculationsChange();
    } catch(e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSavingCalculation(false);
    }
  };

  // Helper totals for UI display before calculation
  const uiGross = entries.filter((e:any) => e.type.includes('earning')).reduce((s:number, e:any) => s + Number(e.amount), 0);
  const uiDeduct = entries.filter((e:any) => e.type.includes('deduction')).reduce((s:number, e:any) => s + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Tax Summary {currentYear}
        </CardTitle>
        <CardDescription>Using 2026 Rules (Cloud)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between font-medium">
          <span>Est. Gross:</span> <span>₦{uiGross.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Est. Deductions:</span> <span>₦{uiDeduct.toLocaleString()}</span>
        </div>

        {taxResults && (
          <div className="bg-primary/5 p-4 rounded-lg space-y-2">
            <div className="flex justify-between font-bold">
              <span>Taxable Income:</span>
              <span>₦{taxResults.taxable_income?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>CRA Relief:</span>
              <span>-₦{taxResults.consolidated_relief_allowance?.toLocaleString() ?? 0}</span>
            </div>
            <hr />
            <div className="flex justify-between text-red-600 font-bold">
              <span>Tax Due:</span>
              <span>₦{(taxResults.personal_income_tax_due + taxResults.capital_gains_tax_due).toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button className="flex-1" onClick={calculateTax} disabled={calculating}>
            {calculating ? <Loader2 className="animate-spin mr-2" /> : "Recalculate"}
          </Button>
          <Button variant="outline" onClick={saveCalculation} disabled={!taxResults || savingCalculation}>
            {savingCalculation ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
