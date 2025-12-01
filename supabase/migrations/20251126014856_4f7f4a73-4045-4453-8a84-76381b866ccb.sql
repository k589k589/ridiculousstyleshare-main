-- Add try_count column to outfits table
ALTER TABLE public.outfits
ADD COLUMN try_count integer DEFAULT 0;

-- Create function to increment outfit try count
CREATE OR REPLACE FUNCTION public.increment_outfit_tries(outfit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE outfits
  SET try_count = COALESCE(try_count, 0) + 1
  WHERE id = outfit_id;
END;
$$;