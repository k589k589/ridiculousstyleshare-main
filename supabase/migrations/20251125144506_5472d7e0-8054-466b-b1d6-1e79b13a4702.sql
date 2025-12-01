-- Drop the old constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with 'vip_upgrade' type
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text, 'reply'::text, 'vip_upgrade'::text]));

-- Create notification for VIP upgrade
INSERT INTO public.notifications (
  user_id,
  actor_id,
  type,
  content,
  is_read
)
VALUES (
  '9b2cd83d-0f78-46ee-8afc-8934363eb44d',
  '9b2cd83d-0f78-46ee-8afc-8934363eb44d',
  'vip_upgrade',
  '恭喜！您已成功升級為 VIP 會員，享受無限次數試穿功能！',
  false
);