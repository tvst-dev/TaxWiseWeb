// TaxWiseWeb/src/pages/PricingPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Check, ArrowLeft, Zap, Building2, Rocket, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { initiatePayment, PaymentData } from '@/lib/paystack';

// Make toast available globally for Paystack callback
declare global {
  interface Window {
    showToast?: (options: { title: string; description: string; variant?: string }) => void;
  }
}

interface Subscription {
  tier: string;
  status: string;
  is_legacy_user: boolean | null;
}

export default function PricingPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Make toast available globally
  useEffect(() => {
    window.showToast = (options) => {
      toast({
        title: options.title,
        description: options.description,
        variant: options.variant as 'destructive' | 'default',
      });
    };
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('api_subscriptions')
        .select('tier, status, is_legacy_user')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - not a real error for new users
        console.error('Error fetching subscription:', error);
      }
      
      setSubscription(data);
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
      return;
    }

    try {
      setLoading(true);

      // Get plan details
      const plan = plans.find(p => p.tier === tier);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Extract amount from price string (remove ₦ and commas)
      const amount = parseFloat(plan.price.replace('₦', '').replace(',', ''));

      const paymentData: PaymentData = {
        email: user.email || '',
        amount: amount,
        plan: tier,
        userId: user.id,
      };

      await initiatePayment(paymentData);

      // Note: Toast is shown inside initiatePayment on success
    } catch (error) {
      console.error('Error initiating upgrade:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment. Please try again.',
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
      price: '₦100.90',
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

  // Determine if user can access dashboard
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.is_legacy_user;
  const hasPendingPayment = subscription?.status === 'pending';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button and Sign Out */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {hasActiveSubscription && (
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
          </div>
          
          {user && (
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="ml-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Access Restricted Alert for Pending Users */}
        {hasPendingPayment && (
          <Alert className="mb-8 border-orange-200 bg-orange-50 max-w-7xl mx-auto">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              Payment Required - Access Restricted
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              Your account is currently in pending status. Please complete payment below to activate your subscription and unlock access to the dashboard, API keys, and all platform features.
            </AlertDescription>
          </Alert>
        )}

        {/* Legacy User Alert */}
        {subscription?.is_legacy_user && (
          <Alert className="mb-8 border-blue-200 bg-blue-50 max-w-7xl mx-auto">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">
              Grandfathered Account - Lifetime Access
            </AlertTitle>
            <AlertDescription className="text-blue-800">
              You have lifetime access to the {subscription.tier.replace('_', ' ')} plan. No payment required! You can view other plans below or{' '}
              <Button 
                variant="link" 
                className="h-auto p-0 text-blue-700 font-semibold"
                onClick={() => navigate('/dashboard')}
              >
                return to dashboard
              </Button>
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
              : 'Upgrade to unlock powerful features for your business including API access, advanced analytics, and team collaboration tools'
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
                              ? 'Upgrade'
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
    </div>
  );
}
