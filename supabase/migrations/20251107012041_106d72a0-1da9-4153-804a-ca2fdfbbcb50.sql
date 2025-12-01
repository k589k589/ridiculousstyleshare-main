-- Create VIP subscriptions table
CREATE TABLE public.vip_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paypal_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  plan_id text NOT NULL,
  start_date timestamp with time zone,
  next_billing_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription"
ON public.vip_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscription"
ON public.vip_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can update subscriptions"
ON public.vip_subscriptions
FOR UPDATE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_vip_subscriptions_updated_at
BEFORE UPDATE ON public.vip_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_vip_subscriptions_user_id ON public.vip_subscriptions(user_id);
CREATE INDEX idx_vip_subscriptions_paypal_id ON public.vip_subscriptions(paypal_subscription_id);