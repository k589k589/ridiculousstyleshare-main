-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'reply')),
  outfit_id UUID,
  comment_id UUID,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_actor_id UUID,
  p_type TEXT,
  p_outfit_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_content TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create notification if actor is the same as user
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  -- Create notification
  INSERT INTO public.notifications (user_id, actor_id, type, outfit_id, comment_id, content)
  VALUES (p_user_id, p_actor_id, p_type, p_outfit_id, p_comment_id, p_content)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger to create notification on outfit like
CREATE OR REPLACE FUNCTION public.notify_outfit_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outfit_user_id UUID;
BEGIN
  -- Get outfit owner
  SELECT user_id INTO v_outfit_user_id
  FROM public.outfits
  WHERE id = NEW.outfit_id;

  -- Create notification
  PERFORM public.create_notification(
    v_outfit_user_id,
    NEW.user_id,
    'like',
    NEW.outfit_id,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_outfit_like
  AFTER INSERT ON public.outfit_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_outfit_like();

-- Trigger to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_outfit_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_outfit_user_id UUID;
BEGIN
  -- Get outfit owner
  SELECT user_id INTO v_outfit_user_id
  FROM public.outfits
  WHERE id = NEW.outfit_id;

  -- Create notification
  PERFORM public.create_notification(
    v_outfit_user_id,
    NEW.user_id,
    'comment',
    NEW.outfit_id,
    NEW.id,
    NEW.content
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_outfit_comment
  AFTER INSERT ON public.outfit_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_outfit_comment();

-- Trigger to create notification on follow
CREATE OR REPLACE FUNCTION public.notify_user_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create notification
  PERFORM public.create_notification(
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NULL,
    NULL,
    NULL
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_user_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_follow();