// src/pages/Dashboard.tsx (FIXED - Uses profiles table consistently)
import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, TrendingUp, TrendingDown, Calculator, Settings, LogOut, Zap, CreditCard, Code } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EntryForm } from '@/components/EntryForm';
import { EntryList } from '@/components/EntryList';
import { TaxSummary } from '@/components/TaxSummary';
import { UserPreferences } from '@/components/UserPreferences';
import { Entry as TaxEntry } from '@/utils/taxCalculator';

interface TaxCalculation {
  id: string;
  year: number;
  total_earnings: number;
  total_deductions: number;
  taxable_income: number;
  estimated_tax_rate: number;
  estimated_tax_owed: number;
}

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [entries, setEntries] = useState<TaxEntry[]>([]);
  const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const checkSubscriptionAccess = useCallback(async () => {
    try {
      console.log('🔍 Dashboard checking subscription for user:', user?.id);

      // ✅ FIX: Use profiles table (same as ProtectedRoute and payment callback)
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_end')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('📊 Dashboard subscription data:', data);

      if (error) {
        console.error('❌ Error checking subscription:', error);
        return;
      }

      if (!data) {
        console.log('⚠️ No profile found');
        toast({ 
          title: 'Subscription Required', 
          description: 'Please complete payment to access dashboard.', 
          variant: 'destructive' 
        });
        navigate('/pricing');
        return;
      }

      setSubscription({
        tier: data.subscription_plan || 'individual',
        status: data.subscription_status || 'pending',
        current_period_end: data.subscription_end
      });

      // ✅ Check if subscription is active
      if (data.subscription_status !== 'active') {
        console.log('⚠️ Subscription not active:', data.subscription_status);
        toast({ 
          title: 'Subscription Required', 
          description: 'Please complete payment to access dashboard.', 
          variant: 'destructive' 
        });
        navigate('/pricing');
        return;
      }

      // ✅ Check if subscription has expired
      if (data.subscription_end) {
        const endDate = new Date(data.subscription_end);
        const now = new Date();
        
        if (now > endDate) {
          console.log('⏰ Subscription expired');
          toast({ 
            title: 'Subscription Expired', 
            description: 'Please renew your subscription.', 
            variant: 'destructive' 
          });
          
          // Update status in database
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user?.id);
          
          navigate('/pricing');
          return;
        }
      }

      console.log('✅ Dashboard access granted');

    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    if (user) {
      checkSubscriptionAccess();
      fetchEntries();
      fetchTaxCalculations();
    }
  }, [user, checkSubscriptionAccess]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      // Normalize DB data to TaxEntry type (plural)
      const formattedEntries = (data || []).map((entry) => ({
        ...entry,
        type: (entry.type === 'earning' ? 'earnings' : (entry.type === 'deduction' ? 'deductions' : entry.type)) as 'earnings' | 'deductions'
      })) as TaxEntry[];

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch entries', 
        variant: 'destructive' 
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
    } catch (error) {
      console.error('Error fetching calculations:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch calculations', 
        variant: 'destructive' 
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'Successfully signed out.' });
    navigate('/auth');
  };

  if (!user) return <Navigate to="/auth" replace />;

  const currentYear = new Date().getFullYear();
  const currentYearEntries = entries.filter(entry => new Date(entry.date).getFullYear() === currentYear);
  
  const totalEarnings = currentYearEntries
    .filter(entry => entry.type === 'earnings')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);
    
  const totalDeductions = currentYearEntries
    .filter(entry => entry.type === 'deductions')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">TaxWise</h1>
            <p className="text-muted-foreground">Nigeria Tax Management System</p>
          </div>
          <div className="flex items-center gap-4">
            {subscription && (
              <Badge variant="secondary" className="text-sm">
                {subscription.tier.replace('_', ' ').toUpperCase()} Plan
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate('/developer')}>
              <Code className="h-5 w-5 mr-2" />
              Developer
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>
              <CreditCard className="h-5 w-5 mr-2" />
              Manage Plan
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings ({currentYear})</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentYearEntries.filter(e => e.type === 'earnings').length} entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deductions ({currentYear})</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₦{totalDeductions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentYearEntries.filter(e => e.type === 'deductions').length} entries
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
              <div className="text-xs text-muted-foreground mt-1">
                {totalEarnings - totalDeductions <= 800000 ? (
                  <Badge variant="secondary">Tax Exempt</Badge>
                ) : (
                  <Badge variant="outline">Taxable</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Entries</h2>
              <Button onClick={() => setShowEntryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <EntryList
              entries={entries.map(e => ({
                ...e,
                type: (e.type === 'earnings' ? 'earning' : 'deduction') as 'earning' | 'deduction'
              }))}
              onEntriesChange={fetchEntries}
            />
          </div>

          <div>
            <TaxSummary
              entries={currentYearEntries}
              taxCalculations={taxCalculations}
              onCalculationsChange={fetchTaxCalculations}
            />
          </div>
        </div>
      </div>

      {showEntryForm && (
        <EntryForm
          onClose={() => setShowEntryForm(false)}
          onEntryAdded={fetchEntries}
        />
      )}

      {showPreferences && (
        <UserPreferences
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
}
