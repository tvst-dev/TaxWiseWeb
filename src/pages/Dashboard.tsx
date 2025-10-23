import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, TrendingUp, TrendingDown, Calculator, Settings, LogOut, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { EntryForm } from '@/components/EntryForm';
import { EntryList } from '@/components/EntryList';
import { TaxSummary } from '@/components/TaxSummary';
import { UserPreferences } from '@/components/UserPreferences';

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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    fetchEntries();
    fetchTaxCalculations();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setEntries((data || []).map(entry => ({
        ...entry,
        type: entry.type as 'earning' | 'deduction'
      })));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch entries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxCalculations = async () => {
    try {
      const { data, error } = await supabase
        .from('tax_calculations')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setTaxCalculations(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tax calculations',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
  };

  const currentYear = new Date().getFullYear();
  const currentYearEntries = entries.filter(entry => new Date(entry.date).getFullYear() === currentYear);
  const totalEarnings = currentYearEntries
    .filter(entry => entry.type === 'earning')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalDeductions = currentYearEntries
    .filter(entry => entry.type === 'deduction')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">TaxWise</h1>
            <p className="text-muted-foreground">Nigeria Tax Management System</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="default" onClick={() => navigate('/pricing')}>
              <Zap className="h-5 w-5 mr-2" />
              Upgrade
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPreferences(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings ({currentYear})</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentYearEntries.filter(e => e.type === 'earning').length} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions ({currentYear})</CardTitle>
              <TrendingDown className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentYearEntries.filter(e => e.type === 'deduction').length} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxable Income ({currentYear})</CardTitle>
              <Calculator className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{Math.max(0, totalEarnings - totalDeductions).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalEarnings - totalDeductions <= 800000 ? (
                  <Badge variant="secondary" className="text-xs">Tax Exempt</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Taxable</Badge>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Entries Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Entries</h2>
              <Button onClick={() => setShowEntryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
            
            <EntryList 
              entries={entries} 
              onEntriesChange={fetchEntries}
            />
          </div>

          {/* Tax Summary */}
          <div>
            <TaxSummary 
              entries={currentYearEntries}
              taxCalculations={taxCalculations}
              onCalculationsChange={fetchTaxCalculations}
            />
          </div>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <EntryForm
          onClose={() => setShowEntryForm(false)}
          onEntryAdded={fetchEntries}
        />
      )}

      {/* User Preferences Modal */}
      {showPreferences && (
        <UserPreferences
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}