import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, ArrowLeft, Zap, Building2, Rocket } from 'lucide-react';
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
}

export default function PricingPage() {
  const { user } = useAuth();
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
    }
  }, [user]);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('api_subscriptions')
      .select('tier')
      .single();

    setSubscription(data);
    setLoading(false);
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
      tier: 'individuals',
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
      cta: 'Current Plan',
      disabled: true,
    },
    {
      name: 'Small Businesses',
      tier: 'small_businesses',
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
      cta: 'Upgrade to Small Businesses',
      disabled: false,
    },
    {
      name: 'Large Corporations',
      tier: 'large_corporations',
      price: '₦4,999.90',
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
      cta: 'Contact Sales',
      disabled: false,
    },
  ];

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

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upgrade to unlock powerful features for your business including API access, 
            advanced analytics, and team collaboration tools
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.tier === plan.tier;
            
            return (
              <Card 
                key={plan.tier} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                    {isCurrentPlan && (
                      <Badge variant="secondary">Current</Badge>
                    )}
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
                    variant={plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan || loading}
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.cta}
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
