-- Upgrade Judy Huang to VIP
INSERT INTO public.vip_subscriptions (
  user_id,
  plan_id,
  status,
  start_date,
  next_billing_date
)
VALUES (
  '01f4b42c-963d-4742-a2c4-ee8a27e3c90f',
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