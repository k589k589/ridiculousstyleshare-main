-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.increment_outfit_comments(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET comments_count = comments_count + 1 
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_outfit_comments(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;