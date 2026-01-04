// TaxWiseWeb/src/pages/PricingPage.tsx (FIXED - Step 3)
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, ArrowLeft, Zap, Building2, Rocket, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  tier: string;
  status: string;
  is_legacy_user: boolean | null;
}

interface Profile {
  company_name: string | null;
  company_size: string | null;
  job_title: string | null;
  is_company_rep: boolean | null;
}

export default function PricingPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Company details dialog
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isCompanyRep, setIsCompanyRep] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionAndProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionAndProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, company_name, company_size, job_title, is_company_rep')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching data:', error);
      }
      
      if (data) {
        setSubscription({
          tier: data.subscription_plan || 'individual',
          status: data.subscription_status || 'pending',
          is_legacy_user: false
        });
        
        setProfile({
          company_name: data.company_name,
          company_size: data.company_size,
          job_title: data.job_title,
          is_company_rep: data.is_company_rep
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upgrade your plan.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // ✅ Check if business plan and company details are missing
    const isBusinessPlan = tier !== 'individual';
    const hasCompanyDetails = profile?.company_name && profile?.company_size && profile?.job_title;

    if (isBusinessPlan && !hasCompanyDetails) {
      // Show dialog to collect company details
      setSelectedPlan(tier);
      setShowCompanyDialog(true);
      return;
    }

    // Proceed with payment
    await initiatePayment(tier);
  };

  const handleCompanyDetailsSubmit = async () => {
    // Validate company details
    if (!companyName || !companySize || !jobTitle) {
      toast({
        title: 'Error',
        description: 'Please fill all company details',
        variant: 'destructive',
      });
      return;
    }

    if (!isCompanyRep) {
      toast({
        title: 'Error',
        description: 'Please confirm authorization',
        variant: 'destructive',
      });
      return;
    }

    try {
      // ✅ Update profile with company details first
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName.trim(),
          company_size: companySize,
          job_title: jobTitle.trim(),
          is_company_rep: isCompanyRep,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Close dialog and proceed with payment
      setShowCompanyDialog(false);
      await initiatePayment(selectedPlan);

    } catch (error: any) {
      console.error('Error updating company details:', error);
      toast({
        title: 'Error',
        description: 'Failed to save company details',
        variant: 'destructive',
      });
    }
  };

  const initiatePayment = async (tier: string) => {
    try {
      setLoading(true);

      const plan = plans.find(p => p.tier === tier);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Extract amount from price string
      const amount = parseFloat(plan.price.replace('₦', '').replace(',', ''));

      // ✅ Build payment data with ALL metadata
      const paymentData: any = {
        email: user.email || '',
        amount: amount,
        plan: tier,
        user_id: user.id,
        callback_url: `${window.location.origin}/payment-callback.html`
      };

      // ✅ Add company details to metadata (from profile or form)
      if (tier !== 'individual') {
        paymentData.company_name = companyName || profile?.company_name || '';
        paymentData.company_size = companySize || profile?.company_size || '';
        paymentData.job_title = jobTitle || profile?.job_title || '';
        paymentData.is_company_rep = isCompanyRep || profile?.is_company_rep || false;
      }

      console.log('💳 Initiating payment:', paymentData);

      const { data, error } = await supabase.functions.invoke('initialize-payment', {
        body: paymentData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (!data || !data.status || !data.data?.authorization_url) {
        throw new Error(data?.message || 'Failed to initialize payment');
      }

      console.log('✅ Redirecting to Paystack...');
      window.location.href = data.data.authorization_url;

    } catch (error: any) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Individuals',
      tier: 'individual',
      price: '₦1,499.90',
      period: 'per month',
      icon: Zap,
      description: 'Perfect for individuals and testing',
      features: [
        'Unlimited tax calculations',
        'Basic entry management',
        'Annual tax reports',
        'Email support',
        'Mobile app access',
      ],
      limits: [
        '1,000 API requests/month',
        'Basic API access',
      ],
      cta: 'Select Plan',
      disabled: false,
    },
    {
      name: 'Small Businesses',
      tier: 'small_business',
      price: '₦24,999.90',
      period: 'per month',
      icon: Rocket,
      description: 'For growing businesses and startups',
      popular: true,
      features: [
        'Everything in Individuals',
        'API Key Generation',
        'Developer Documentation',
        'Advanced analytics',
        'Priority support',
        'Custom tax categories',
        'Bulk import/export',
        'Team collaboration (5 users)',
      ],
      limits: [
        '10,000 API requests/month',
        'Advanced API features',
      ],
      cta: 'Select Plan',
      disabled: false,
    },
    {
      name: 'Large Corporations',
      tier: 'large_corporation',
      price: '₦100.00',
      period: 'per month',
      icon: Building2,
      description: 'For large organizations',
      features: [
        'Everything in Small Businesses',
        'Unlimited API requests',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Advanced security',
        'Audit logs',
        'Unlimited team members',
        'Custom onboarding',
        'White-label options',
      ],
      limits: [
        '100,000 API requests/month',
        'Full API access',
        'Custom rate limits',
      ],
      cta: 'Select Plan',
      disabled: false,
    },
  ];

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.is_legacy_user;
  const hasPendingPayment = subscription?.status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {hasActiveSubscription && (
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
          </div>
          
          {user && (
            <Button variant="outline" onClick={handleSignOut} className="ml-auto">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        {hasPendingPayment && (
          <Alert className="mb-8 border-orange-200 bg-orange-50 max-w-7xl mx-auto">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              Payment Required - Access Restricted
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              Your account is currently in pending status. Please complete payment below to activate your subscription.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {hasPendingPayment ? 'Complete Your Payment' : 'Choose Your Plan'}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {hasPendingPayment 
              ? 'Select your plan below to complete payment and unlock full access to TaxWise'
              : 'Upgrade to unlock powerful features for your business'
            }
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.tier === plan.tier;
            const isPendingThisPlan = hasPendingPayment && isCurrentPlan;
            const canSelect = !subscription?.is_legacy_user;

            return (
              <Card
                key={plan.tier}
                className={`relative ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                } ${isPendingThisPlan ? 'ring-2 ring-orange-400' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}

                {isPendingThisPlan && (
                  <Badge className="absolute -top-3 right-4 bg-orange-500">
                    Pending Payment
                  </Badge>
                )}

                {isCurrentPlan && hasActiveSubscription && (
                  <Badge className="absolute -top-3 right-4 bg-green-600" variant="secondary">
                    Current Plan
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">/{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <p className="font-semibold text-sm">Features:</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limits.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-sm mb-3">API Limits:</p>
                      {plan.limits.map((limit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{limit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={plan.popular || isPendingThisPlan ? 'default' : 'outline'}
                    disabled={
                      !canSelect || 
                      (isCurrentPlan && hasActiveSubscription) || 
                      loading
                    }
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {subscription?.is_legacy_user 
                      ? 'Grandfathered'
                      : isCurrentPlan && hasActiveSubscription 
                        ? 'Current Plan'
                        : isPendingThisPlan
                          ? 'Complete Payment'
                          : hasPendingPayment
                            ? 'Switch & Pay'
                            : hasActiveSubscription
                              ? (() => {
                                  // Determine if upgrade, downgrade, or switch
                                  const planOrder = { individual: 1, small_business: 2, large_corporation: 3 };
                                  const currentOrder = planOrder[subscription?.tier as keyof typeof planOrder] || 0;
                                  const targetOrder = planOrder[plan.tier as keyof typeof planOrder] || 0;
                                  
                                  if (targetOrder > currentOrder) return 'Upgrade';
                                  if (targetOrder < currentOrder) return 'Downgrade';
                                  return 'Switch Plan';
                                })()
                              : plan.cta
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Need a Custom Plan?</CardTitle>
              <CardDescription>
                We offer custom enterprise solutions tailored to your specific needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Contact our sales team to discuss volume discounts, custom integrations,
                and dedicated support options.
              </p>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ Company Details Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Company Details Required</DialogTitle>
            <DialogDescription>
              Please provide your company information to proceed with the business plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input 
                placeholder="e.g. Acme Corporation Ltd" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)} 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your Job Title *</Label>
                <Input 
                  placeholder="e.g. CEO, CFO" 
                  value={jobTitle} 
                  onChange={e => setJobTitle(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Staff *</Label>
                <Select value={companySize} onValueChange={setCompanySize} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="500+">500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <Checkbox 
                id="rep-dialog" 
                checked={isCompanyRep} 
                onCheckedChange={(c) => setIsCompanyRep(c as boolean)} 
                required 
                className="mt-1" 
              />
              <Label htmlFor="rep-dialog" className="text-sm leading-tight font-normal text-gray-700 cursor-pointer">
                I confirm that I am authorized to create this account on behalf of{' '}
                <strong>{companyName || 'the company'}</strong> and have the authority to enter into this agreement.
              </Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCompanyDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCompanyDetailsSubmit} className="flex-1">
              Continue to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
