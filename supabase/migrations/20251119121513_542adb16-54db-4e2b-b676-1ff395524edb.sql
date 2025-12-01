-- Create user_follows table for tracking user relationships
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows"
  ON public.user_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- Create functions to update follower/following counts
CREATE OR REPLACE FUNCTION public.increment_follower_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = followers_count + 1
  WHERE profiles.user_id = increment_follower_count.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_follower_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE profiles.user_id = decrement_follower_count.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_following_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET following_count = following_count + 1
  WHERE profiles.user_id = increment_following_count.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_following_count(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE profiles.user_id = decrement_following_count.user_id;
END;
$$;