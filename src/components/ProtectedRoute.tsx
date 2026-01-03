// TaxWiseWeb/src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiresActiveSubscription = true 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setCheckingSubscription(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('api_subscriptions')
          .select('status, is_legacy_user')
          .single();

        if (error) {
          // Handle "no rows returned" error gracefully for new users
          if (error.code === 'PGRST116') {
            console.log('No subscription found, setting to pending');
            setSubscriptionStatus('pending');
          } else {
            console.error('Error fetching subscription:', error);
            setSubscriptionStatus('pending');
          }
        } else {
          // Legacy users always have access
          if (data?.is_legacy_user) {
            setSubscriptionStatus('active');
          } else {
            setSubscriptionStatus(data?.status || 'pending');
          }
        }
      } catch (error) {
        console.error('Subscription check error:', error);
        setSubscriptionStatus('pending');
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscription();
  }, [user]);

  // Show loading spinner while checking auth or subscription
  if (authLoading || checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If route requires active subscription and user doesn't have one
  if (requiresActiveSubscription && subscriptionStatus !== 'active') {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
