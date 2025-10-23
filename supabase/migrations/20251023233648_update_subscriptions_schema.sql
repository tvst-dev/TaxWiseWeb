-- Update api_subscriptions table with new fields
ALTER TABLE public.api_subscriptions
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'canceled', 'past_due')),
ADD COLUMN amount NUMERIC DEFAULT 0,
ADD COLUMN currency TEXT DEFAULT 'NGN',
ADD COLUMN paystack_customer_code TEXT,
ADD COLUMN paystack_subscription_code TEXT,
ADD COLUMN current_period_start TIMESTAMPTZ,
ADD COLUMN current_period_end TIMESTAMPTZ,
ADD COLUMN is_legacy_user BOOLEAN DEFAULT false;

-- Update tier values to match new schema
UPDATE public.api_subscriptions
SET tier = CASE
  WHEN tier = 'individuals' THEN 'individual'
  WHEN tier = 'small_businesses' THEN 'small_business'
  WHEN tier = 'large_corporations' THEN 'large_corporation'
  ELSE tier
END;

-- Update tier constraint
ALTER TABLE public.api_subscriptions
DROP CONSTRAINT IF EXISTS api_subscriptions_tier_check,
ADD CONSTRAINT api_subscriptions_tier_check
CHECK (tier IN ('free', 'individual', 'small_business', 'large_corporation'));

-- Migrate existing users to legacy status
UPDATE public.api_subscriptions
SET
  is_legacy_user = true,
  status = 'active',
  tier = 'individual'
WHERE tier = 'free' OR tier = 'individual';

-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.api_subscriptions(id),
  paystack_reference TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  payment_method TEXT,
  plan_type TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view their own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_paystack_reference ON public.payment_transactions(paystack_reference);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at);

-- Update trigger for api_subscriptions
CREATE TRIGGER update_api_subscriptions_updated_at
  BEFORE UPDATE ON public.api_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
