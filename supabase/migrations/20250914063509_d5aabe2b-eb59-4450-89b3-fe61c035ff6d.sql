-- Fix function security issues with CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_outfit_likes(UUID);
DROP FUNCTION IF EXISTS public.decrement_outfit_likes(UUID);

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

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();