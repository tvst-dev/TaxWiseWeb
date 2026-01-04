// TaxWiseWeb/src/components/ProtectedRoute.tsx (FIXED)
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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setCheckingSubscription(false);
        setHasAccess(false);
        return;
      }

      try {
        console.log('🔍 Checking subscription for user:', user.id);

        // ✅ FIX: Use profiles table (same as mobile app and edge function)
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_end, onboarding_status')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('📊 Profile data:', data);
        console.log('❌ Profile error:', error);

        if (error) {
          console.error('Error fetching profile:', error);
          setHasAccess(false);
          setCheckingSubscription(false);
          return;
        }

        if (!data) {
          console.log('⚠️ No profile found for user');
          setHasAccess(false);
          setCheckingSubscription(false);
          return;
        }

        // Check subscription status
        const subscriptionStatus = data.subscription_status || 'pending';
        const onboardingStatus = data.onboarding_status || 'pending_payment';
        
        console.log('📋 Subscription status:', subscriptionStatus);
        console.log('📋 Onboarding status:', onboardingStatus);

        // Check if subscription is active
        let isActive = subscriptionStatus === 'active' && onboardingStatus === 'active';

        // Also check if subscription hasn't expired
        if (data.subscription_end && isActive) {
          const endDate = new Date(data.subscription_end);
          const now = new Date();
          
          if (now > endDate) {
            console.log('⏰ Subscription expired');
            isActive = false;
            
            // Update status in database
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'expired',
                onboarding_status: 'pending_payment',
              })
              .eq('user_id', user.id);
          }
        }

        console.log('✅ Has access:', isActive);
        setHasAccess(isActive);

      } catch (error) {
        console.error('❌ Subscription check error:', error);
        setHasAccess(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    // Small delay to ensure auth state is stable
    const timer = setTimeout(() => {
      checkSubscription();
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  // Show loading while checking
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

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No active subscription - redirect to pricing
  if (requiresActiveSubscription && !hasAccess) {
    console.log('🚫 Redirecting to pricing - no active subscription');
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  // All checks passed
  return <>{children}</>;
}
