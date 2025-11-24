import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackConfig) => { openIframe: () => void };
    };
    showToast?: (options: { title: string; description: string; variant?: string }) => void;
  }
}

interface PaystackConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  metadata?: {
    plan: string;
    userId: string;
    isSignUp?: boolean;
  };
  callback: (response: PaystackResponse) => void;
  onClose: () => void;
}

export interface PaymentData {
  email: string;
  amount: number;
  plan: string;
  userId: string;
  isSignUp?: boolean;
}

interface PaystackResponse {
  reference: string;
  metadata?: {
    plan: string;
    userId: string;
    isSignUp?: boolean;
  };
}

export const initiatePayment = async (data: PaymentData) => {
  try {
    // Load Paystack inline script if not already loaded
    if (!window.PaystackPop) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const config = {
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: data.email,
      amount: data.amount * 100, // Paystack expects amount in kobo (multiply by 100 for Naira)
      ref: (new Date()).getTime().toString(),
      metadata: {
        plan: data.plan,
        userId: data.userId,
        isSignUp: data.isSignUp,
      },
      callback: (response: PaystackResponse) => {
        console.log('Payment successful:', response);
        handlePaymentSuccess(response);
      },
      onClose: () => {
        console.log('Payment cancelled');
      },
    };

    window.PaystackPop.setup(config).openIframe();
  } catch (error) {
    console.error('Error initiating payment:', error);
    throw error;
  }
};

const handlePaymentSuccess = async (response: PaystackResponse) => {
  try {
    const { reference, metadata } = response;
    const { plan, userId, isSignUp } = metadata || {};

    if (!plan) {
      console.error('Missing plan in payment response');
      // Show error toast if available
      if (window.showToast) {
        window.showToast({
          title: 'Payment Error',
          description: 'Missing payment information. Please contact support.',
          variant: 'destructive',
        });
      }
      return;
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      const paymentAmount = verifyData.data.amount / 100; // Convert from kobo to naira
      const customerCode = verifyData.data.customer.customer_code;
      const subscriptionCode = verifyData.data.subscription?.subscription_code;

      if (isSignUp) {
        // For signup, we need to get the user ID from the email since user might not be logged in yet
        // The user should be created by now, so we can find them by email
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error('Error getting user after signup:', userError);
          if (window.showToast) {
            window.showToast({
              title: 'Account Creation Error',
              description: 'Payment was successful but account setup failed. Please contact support.',
              variant: 'destructive',
            });
          }
          return;
        }

        // Calculate billing period (1 month from now)
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        // Update subscription for the new user
        const { data: subscriptionData, error } = await supabase
          .from('api_subscriptions')
          .update({
            tier: plan,
            status: 'active',
            amount: paymentAmount,
            currency: 'NGN',
            paystack_customer_code: customerCode,
            paystack_subscription_code: subscriptionCode,
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            is_legacy_user: false
          })
          .eq('user_id', userData.user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating subscription for new user:', error);
          if (window.showToast) {
            window.showToast({
              title: 'Subscription Setup Failed',
              description: 'Payment was successful but subscription setup failed. Please contact support.',
              variant: 'destructive',
            });
          }
          return;
        }

        // Insert payment transaction record
        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userData.user.id,
            subscription_id: subscriptionData.id,
            paystack_reference: reference,
            amount: paymentAmount,
            currency: 'NGN',
            status: 'success',
            plan_type: plan,
            paid_at: new Date().toISOString(),
            metadata: {
              customer_code: customerCode,
              subscription_code: subscriptionCode
            }
          });

        if (transactionError) {
          console.error('Error creating payment transaction:', transactionError);
          // Don't fail the whole process for transaction logging error
        }

        console.log('New user subscription set up successfully');
        if (window.showToast) {
          window.showToast({
            title: 'Welcome to TaxWise!',
            description: `Your ${plan} plan is now active.`,
          });
        }
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // Regular upgrade flow
        if (!userId) {
          console.error('Missing userId for upgrade');
          if (window.showToast) {
            window.showToast({
              title: 'Payment Error',
              description: 'Missing user information. Please contact support.',
              variant: 'destructive',
            });
          }
          return;
        }

        // Calculate billing period (1 month from now)
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

        // Update subscription in Supabase
        const { data: subscriptionData, error } = await supabase
          .from('api_subscriptions')
          .update({
            tier: plan,
            status: 'active',
            amount: paymentAmount,
            currency: 'NGN',
            paystack_customer_code: customerCode,
            paystack_subscription_code: subscriptionCode,
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            is_legacy_user: false
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Error updating subscription:', error);
          // Show error toast if available
          if (window.showToast) {
            window.showToast({
              title: 'Subscription Update Failed',
              description: 'Payment was successful but subscription update failed. Please contact support.',
              variant: 'destructive',
            });
          }
          return;
        }

        // Insert payment transaction record
        const { error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            subscription_id: subscriptionData.id,
            paystack_reference: reference,
            amount: paymentAmount,
            currency: 'NGN',
            status: 'success',
            plan_type: plan,
            paid_at: new Date().toISOString(),
            metadata: {
              customer_code: customerCode,
              subscription_code: subscriptionCode
            }
          });

        if (transactionError) {
          console.error('Error creating payment transaction:', transactionError);
          // Don't fail the whole process for transaction logging error
        }

        console.log('Subscription updated successfully');
        // Show success toast if available
        if (window.showToast) {
          window.showToast({
            title: 'Upgrade Successful!',
            description: `Your plan has been upgraded to ${plan}.`,
          });
        }
        // Reload to reflect changes
        window.location.reload();
      }
    } else {
      console.error('Payment verification failed');
      // Show error toast if available
      if (window.showToast) {
        window.showToast({
          title: 'Payment Verification Failed',
          description: 'Please contact support if you were charged.',
          variant: 'destructive',
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    // Show error toast if available
    if (window.showToast) {
      window.showToast({
        title: 'Error',
        description: 'An error occurred while processing your payment.',
        variant: 'destructive',
      });
    }
  }
};
