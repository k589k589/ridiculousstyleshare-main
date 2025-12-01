-- Insert VIP subscription for Ching Fang Peng
INSERT INTO public.vip_subscriptions (
  user_id,
  plan_id,
  status,
  start_date,
  next_billing_date
)
VALUES (
  '9b2cd83d-0f78-46ee-8afc-8934363eb44d',
  'manual_vip_upgrade',
  'active',
  now(),
  now() + interval '1 year'
)
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  start_date = COALESCE(vip_subscriptions.start_date, now()),
  next_billing_date = now() + interval '1 year',
  updated_at = now();