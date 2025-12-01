-- Create comments table for outfit posts
CREATE TABLE IF NOT EXISTS public.outfit_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  outfit_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.outfit_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.outfit_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own comments" 
ON public.outfit_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.outfit_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.outfit_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_outfit_comments_updated_at
BEFORE UPDATE ON public.outfit_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments_count column to outfits table
ALTER TABLE public.outfits ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create functions to increment/decrement comment counts
CREATE OR REPLACE FUNCTION public.increment_outfit_comments(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET comments_count = comments_count + 1 
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_outfit_comments(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql;