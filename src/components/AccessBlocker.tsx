// TaxWiseWeb/src/components/AccessBlocker.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, CreditCard, AlertTriangle } from 'lucide-react';

/**
 * AccessBlocker Component
 * 
 * This component can be used to wrap any page content that requires
 * an active subscription. It will show a payment required message
 * if the user's subscription is pending.
 */

interface AccessBlockerProps {
  children: React.ReactNode;
  message?: string;
  showPricingButton?: boolean;
}

export default function AccessBlocker({ 
  children, 
  message = "This feature requires an active subscription",
  showPricingButton = true 
}: AccessBlockerProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [user, location.pathname]);

  const checkAccess = async () => {
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('api_subscriptions')
        .select('status, is_legacy_user')
        .single();

      if (error) {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
      } else {
        // Grant access if legacy user OR status is active
        const access = data?.is_legacy_user || data?.status === 'active';
        setHasAccess(access);
      }
    } catch (error) {
      console.error('Access check error:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-2xl w-full border-orange-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-fit">
              <Lock className="h-12 w-12 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription className="text-base">
              An active subscription is required to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900">Payment Required</AlertTitle>
              <AlertDescription className="text-orange-800">
                {message}. Please complete your payment to unlock full access to all features.
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What you're missing:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Full dashboard access</li>
                <li>• API key generation</li>
                <li>• Tax calculation tools</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
            </div>

            {showPricingButton && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => navigate('/pricing')}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Go to Homepage
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
