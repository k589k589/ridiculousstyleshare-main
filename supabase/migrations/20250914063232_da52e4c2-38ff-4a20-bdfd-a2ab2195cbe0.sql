-- Fix function search path security issues
DROP FUNCTION IF EXISTS public.increment_outfit_likes(UUID);
DROP FUNCTION IF EXISTS public.decrement_outfit_likes(UUID);
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.increment_outfit_likes(outfit_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.outfits 
  SET likes_count = likes_count + 1 
  WHERE id = outfit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_outfit_likes(outfit_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  UPDATE public.outfits 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = outfit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous User'));
  RETURN NEW;
END;
$$;