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
        // Use profiles table (same as mobile app)
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, onboarding_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription:', error);
          setSubscriptionStatus('pending');
        } else if (!data) {
          console.log('No profile found, setting to pending');
          setSubscriptionStatus('pending');
        } else {
          // Check subscription status from profiles table
          const status = data.subscription_status || 'pending';
          console.log('Profile subscription status:', status);
          setSubscriptionStatus(status);
        }
      } catch (error) {
        console.error('Subscription check error:', error);
        setSubscriptionStatus('pending');
      } finally {
        setCheckingSubscription(false);
      }
    };

    // Add a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      checkSubscription();
    }, 100);

    return () => clearTimeout(timer);
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
