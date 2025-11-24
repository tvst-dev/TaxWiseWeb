import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculateTaxLocal, Entry, Profile } from '@/utils/taxCalculator';

interface TaxCalculation {
  id: string;
  year: number;
  total_earnings: number;
  total_deductions: number;
  taxable_income: number;
  estimated_tax_rate: number;
  estimated_tax_owed: number;
}

interface TaxResults {
  taxable_income: number;
  personal_income_tax_due: number;
  capital_gains_tax_due: number;
  vat_due: number;
  stamp_duty_due: number;
  company_income_tax_due: number;
  development_levy_due: number;
  withholding_tax_exempt: boolean;
}

export interface TaxSummaryProps {
  entries: Entry[];
  taxCalculations: TaxCalculation[];
  onCalculationsChange: () => void;
}

export function TaxSummary({ entries, taxCalculations, onCalculationsChange }: TaxSummaryProps) {
  const [calculating, setCalculating] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [userType, setUserType] = useState<string>('individual');
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const isCalculatingRef = useRef(false);
  const currentYear = new Date().getFullYear();

  // Tax Results State
  const [taxResults, setTaxResults] = useState<TaxResults>({
    taxable_income: 0,
    personal_income_tax_due: 0,
    capital_gains_tax_due: 0,
    vat_due: 0,
    stamp_duty_due: 0,
    company_income_tax_due: 0,
    development_levy_due: 0,
    withholding_tax_exempt: false
  });

  // --- FUNCTIONS ---

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user?.user_metadata?.user_type) {
        setUserType(user.user_metadata.user_type);
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData && !error) {
        setProfile({
          id: profileData.id,
          userId: profileData.user_id,
          fullName: profileData.full_name,
          tin: profileData.tin,
          isResident: profileData.is_resident,
          maritalStatus: profileData.marital_status,
          address: profileData.address,
          phoneNumber: profileData.phone_number,
          occupation: profileData.occupation,
          createdAt: profileData.created_at,
          numberOfDependents: profileData.number_of_dependents, 
          annualRentPaid: profileData.annual_rent_paid
        });
      } 
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const calculateTaxLocally = useCallback(() => {
    if (!profile || isCalculatingRef.current) return;
    
    isCalculatingRef.current = true;
    setCalculating(true);
    
    try {
      const result = calculateTaxLocal(entries, profile, currentYear);
      
      if (result) {
        setTaxResults({
          taxable_income: result.taxable_income,
          personal_income_tax_due: result.personal_income_tax_due,
          capital_gains_tax_due: result.capital_gains_tax_due,
          vat_due: result.vat_due,
          stamp_duty_due: result.stamp_duty_due,
          company_income_tax_due: result.company_income_tax_due,
          development_levy_due: result.development_levy_due,
          withholding_tax_exempt: result.withholding_tax_exempt
        });
      }
    } catch (e) {
      console.error("Calculation error", e);
    } finally {
      setCalculating(false);
      isCalculatingRef.current = false;
    }
  }, [entries, profile, currentYear]);

  // --- EFFECTS ---

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (profile && entries.length > 0) {
      calculateTaxLocally();
    }
  }, [entries, profile, calculateTaxLocally]);

  // --- HELPER TOTALS ---

  const totalEarnings = entries
    .filter(e => e.type === 'earnings' || e.type === 'earning')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalDeductions = entries
    .filter(e => e.type === 'deductions' || e.type === 'deduction')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalTaxOwed = 
    taxResults.personal_income_tax_due +
    taxResults.capital_gains_tax_due +
    taxResults.vat_due +
    taxResults.stamp_duty_due +
    taxResults.company_income_tax_due +
    taxResults.development_levy_due;

  const effectiveRate = totalTaxOwed > 0 && taxResults.taxable_income > 0 
    ? (totalTaxOwed / taxResults.taxable_income) * 100 
    : 0;

  const currentYearCalculation = taxCalculations.find(c => c.year === currentYear);

  // --- SAVE FUNCTION ---

  const saveCalculation = async () => {
    setSavingCalculation(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const calcDetails = calculateTaxLocal(entries, profile, currentYear);

      const calculationData = {
        year: currentYear,
        total_earnings: totalEarnings,
        total_deductions: totalDeductions,
        taxable_income: taxResults.taxable_income,
        estimated_tax_rate: effectiveRate,
        estimated_tax_owed: totalTaxOwed,
        user_id: user.id,
        calculation_name: `Tax Calculation ${currentYear}`,
        tax_breakdown: {
          paye: taxResults.personal_income_tax_due,
          cgt: taxResults.capital_gains_tax_due,
          vat: taxResults.vat_due,
          stamp_duty: taxResults.stamp_duty_due,
          cit: taxResults.company_income_tax_due,
          development_levy: taxResults.development_levy_due,
          wht_exempt: taxResults.withholding_tax_exempt,
          cra_total: calcDetails?.consolidated_relief_allowance || 0,
          cra_breakdown: calcDetails?.cra_breakdown
        }
      };

      if (currentYearCalculation) {
        const { error } = await supabase
          .from('tax_calculations')
          .update({...calculationData, updated_at: new Date().toISOString()})
          .eq('id', currentYearCalculation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_calculations')
          .insert(calculationData);
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Tax calculation saved successfully' });
      onCalculationsChange();

    } catch (error: unknown) {
      console.error(error);
      let errorMessage = 'Failed to save';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSavingCalculation(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Summary {currentYear}
          </CardTitle>
          <CardDescription>
            Formula A (Gross - 800k - CRA - Deductions)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Calculating...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Gross Income:</span>
                  <span className="font-semibold">₦{totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Deductions:</span>
                  <span className="font-semibold text-muted-foreground">₦{totalDeductions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Taxable Income:</span>
                  <span className="font-semibold">₦{taxResults.taxable_income.toLocaleString()}</span>
                </div>

                <hr className="my-3" />
                
                <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Tax Breakdown</h4>
                  <div className="flex justify-between">
                     <span className="text-sm">PAYE (15%):</span>
                     <span className="font-semibold text-primary">₦{taxResults.personal_income_tax_due.toLocaleString()}</span>
                  </div>
                  {taxResults.capital_gains_tax_due > 0 && (
                    <div className="flex justify-between">
                       <span className="text-sm">CGT (10%):</span>
                       <span className="font-semibold text-primary">₦{taxResults.capital_gains_tax_due.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-lg bg-primary/10 p-3 rounded-lg mt-4">
                  <span className="font-semibold">Total Tax Owed:</span>
                  <span className="font-bold text-primary">₦{totalTaxOwed.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveCalculation} disabled={savingCalculation || totalEarnings === 0} className="flex-1">
                  {savingCalculation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Calculation'}
                </Button>
                <Button onClick={calculateTaxLocally} variant="outline">
                  Recalculate
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}