import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Entry {
  id: string;
  type: 'earning' | 'deduction';
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

interface TaxCalculation {
  id: string;
  year: number;
  total_earnings: number;
  total_deductions: number;
  taxable_income: number;
  estimated_tax_rate: number;
  estimated_tax_owed: number;
}

interface TaxSummaryProps {
  entries: Entry[];
  taxCalculations: TaxCalculation[];
  onCalculationsChange: () => void;
}

// Nigeria Tax Brackets 2025 (Individual)
const TAX_BRACKETS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 600000, rate: 7 },
  { min: 600001, max: 1100000, rate: 11 },
  { min: 1100001, max: 1600000, rate: 15 },
  { min: 1600001, max: 3200000, rate: 19 },
  { min: 3200001, max: Infinity, rate: 24 }
];

const calculateTax = (taxableIncome: number, userType: string = 'individual') => {
  if (userType === 'individual') {
    // Tax-free threshold is ₦800,000 but progressive brackets start at ₦300,000
    if (taxableIncome <= 800000) {
      return { taxOwed: 0, effectiveRate: 0 };
    }

    // Apply progressive tax brackets
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min + 1
      );

      tax += (taxableInBracket * bracket.rate) / 100;
      remainingIncome -= taxableInBracket;
    }

    const effectiveRate = (tax / taxableIncome) * 100;
    return { taxOwed: Math.round(tax), effectiveRate: Math.round(effectiveRate * 100) / 100 };
  }

  // For companies
  if (userType === 'startup' && taxableIncome <= 50000000) {
    return { taxOwed: 0, effectiveRate: 0 }; // Exempt for small companies
  }

  const corporateRate = userType === 'big_firm' ? 27.5 : 25; // 2025 rates
  const tax = (taxableIncome * corporateRate) / 100;
  return { taxOwed: Math.round(tax), effectiveRate: corporateRate };
};

export function TaxSummary({ entries, taxCalculations, onCalculationsChange }: TaxSummaryProps) {
  const [calculating, setCalculating] = useState(false);
  const [userType, setUserType] = useState<string>('individual');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.user_type) {
        setUserType(user.user_metadata.user_type);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const currentYear = new Date().getFullYear();
  const totalEarnings = entries
    .filter(entry => entry.type === 'earning')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  
  const totalDeductions = entries
    .filter(entry => entry.type === 'deduction')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const taxableIncome = Math.max(0, totalEarnings - totalDeductions);
  const { taxOwed, effectiveRate } = calculateTax(taxableIncome, userType);

  const currentYearCalculation = taxCalculations.find(calc => calc.year === currentYear);

  const saveCalculation = async () => {
    setCalculating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const calculationData = {
        year: currentYear,
        total_earnings: totalEarnings,
        total_deductions: totalDeductions,
        taxable_income: taxableIncome,
        estimated_tax_rate: effectiveRate,
        estimated_tax_owed: taxOwed,
        user_id: user?.id,
      };

      if (currentYearCalculation) {
        const { error } = await supabase
          .from('tax_calculations')
          .update(calculationData)
          .eq('id', currentYearCalculation.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tax_calculations')
          .insert(calculationData);
        
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Tax calculation saved successfully',
      });
      
      onCalculationsChange();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const getDevelopmentLevy = () => {
    // Development Levy: 4% reducing to 2% in future
    if (userType === 'individual' || taxableIncome <= 50000000) {
      return 0;
    }
    return Math.round(taxableIncome * 0.04);
  };

  const getVAT = () => {
    // VAT is typically on sales, not income, but for estimation
    return Math.round(totalEarnings * 0.075);
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
            Based on Nigeria's 2025 tax reforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Earnings:</span>
              <span className="font-semibold">₦{totalEarnings.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Deductions:</span>
              <span className="font-semibold text-warning">-₦{totalDeductions.toLocaleString()}</span>
            </div>
            
            <hr />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taxable Income:</span>
              <span className="font-semibold">₦{taxableIncome.toLocaleString()}</span>
            </div>

            {userType === 'individual' && taxableIncome <= 800000 && (
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Tax Exempt (Below ₦800k threshold)
                </span>
              </div>
            )}

            {userType !== 'individual' && taxableIncome <= 50000000 && (
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Small Business Tax Exempt
                </span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Estimated Tax Rate:</span>
              <Badge variant="outline">{effectiveRate}%</Badge>
            </div>
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Estimated Tax Owed:</span>
              <span className="font-bold text-primary">₦{taxOwed.toLocaleString()}</span>
            </div>

            {userType !== 'individual' && (
              <>
                <hr />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Development Levy (4%):</span>
                    <span>₦{getDevelopmentLevy().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated VAT (7.5%):</span>
                    <span>₦{getVAT().toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <Button 
            onClick={saveCalculation} 
            disabled={calculating}
            className="w-full"
          >
            {calculating ? 'Saving...' : 'Save Calculation'}
          </Button>

          {taxOwed > 0 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm">
                Remember to make quarterly tax payments to avoid penalties
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Calculations */}
      {taxCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxCalculations.slice(0, 5).map((calc) => (
                <div key={calc.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{calc.year}</span>
                    <div className="text-sm text-muted-foreground">
                      Taxable: ₦{Number(calc.taxable_income).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₦{Number(calc.estimated_tax_owed).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{calc.estimated_tax_rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}