-- Create table to track trending appearances
CREATE TABLE public.trending_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  trending_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(outfit_id, trending_date)
);

-- Enable RLS
ALTER TABLE public.trending_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view trending history"
ON public.trending_history
FOR SELECT
USING (true);

CREATE POLICY "Service can manage trending history"
ON public.trending_history
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index
CREATE INDEX idx_trending_history_date ON public.trending_history(trending_date DESC);
CREATE INDEX idx_trending_history_outfit_id ON public.trending_history(outfit_id);

-- Function to increment trending count
CREATE OR REPLACE FUNCTION increment_trending_count(p_outfit_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if already counted today
  IF NOT EXISTS (
    SELECT 1 FROM public.trending_history
    WHERE outfit_id = p_outfit_id
    AND trending_date = CURRENT_DATE
  ) THEN
    -- Add to trending history
    INSERT INTO public.trending_history (outfit_id, user_id, trending_date)
    VALUES (p_outfit_id, p_user_id, CURRENT_DATE);
    
    -- Increment user's trending count
    UPDATE public.profiles
    SET trending_count = trending_count + 1
    WHERE user_id = p_user_id;
  END IF;
END;
$$;