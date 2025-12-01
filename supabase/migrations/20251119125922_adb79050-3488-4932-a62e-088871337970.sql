-- Create user_bans table
CREATE TABLE public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('temporary', 'permanent')),
  ban_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all bans"
  ON public.user_bans
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create bans"
  ON public.user_bans
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bans"
  ON public.user_bans
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own bans"
  ON public.user_bans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_bans
    WHERE user_id = p_user_id
      AND is_active = true
      AND (
        ban_type = 'permanent'
        OR (ban_type = 'temporary' AND ban_until > now())
      )
  )
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_bans_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_is_active ON public.user_bans(is_active);