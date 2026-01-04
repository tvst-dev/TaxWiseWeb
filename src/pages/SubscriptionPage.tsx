// TaxWiseWeb/src/pages/SubscriptionPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
  last_payment_date: string | null;
}

interface PaymentRecord {
  id: string;
  reference: string;
  amount: number;
  currency: string | null;
  status: string;
  plan: string;
  created_at: string;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch from profiles table (same as mobile app)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, subscription_start, subscription_end, last_payment_date')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch payment history
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanName = (plan: string | null) => {
    if (!plan) return 'No Plan';
    
    switch (plan) {
      case 'individual':
        return 'Individual Plan';
      case 'small_business':
        return 'Small Business Plan';
      case 'large_corporation':
        return 'Large Corporation Plan';
      default:
        return plan;
    }
  };

  const getPlanPrice = (plan: string | null) => {
    switch (plan) {
      case 'individual':
        return '₦1,499.90';
      case 'small_business':
        return '₦24,999.90';
      case 'large_corporation':
        return '₦49,999.90';
      default:
        return 'N/A';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse">Loading subscription details...</div>
        </div>
      </div>
    );
  }

  const isActive = profile?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Subscription Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Details
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Plan</label>
                  <p className="text-lg font-semibold">{getPlanName(profile?.subscription_plan)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(profile?.subscription_status || 'pending')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Monthly Amount</label>
                  <p className="text-lg font-semibold">
                    {getPlanPrice(profile?.subscription_plan)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subscription Period</label>
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile?.subscription_start && profile?.subscription_end
                        ? `${formatDate(profile.subscription_start)} - ${formatDate(profile.subscription_end)}`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/pricing')}>
                  {isActive ? 'Upgrade Plan' : 'Activate Subscription'}
                </Button>
                {isActive && (
                  <Button variant="outline">
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No payment history available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.reference}
                        </TableCell>
                        <TableCell>{getPlanName(payment.plan)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, payment.currency || 'NGN')}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
