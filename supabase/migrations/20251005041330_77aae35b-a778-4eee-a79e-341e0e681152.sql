-- Create table to track user virtual try-on usage
CREATE TABLE public.user_tryons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tryons_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_tryons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tryon count"
ON public.user_tryons
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tryon record"
ON public.user_tryons
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tryon count"
ON public.user_tryons
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_user_tryons_updated_at
BEFORE UPDATE ON public.user_tryons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment tryon count
CREATE OR REPLACE FUNCTION public.increment_user_tryons(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert or update the user's tryon count
  INSERT INTO public.user_tryons (user_id, tryons_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    tryons_count = public.user_tryons.tryons_count + 1,
    updated_at = now()
  RETURNING tryons_count INTO v_count;
  
  RETURN v_count;
END;
$$;