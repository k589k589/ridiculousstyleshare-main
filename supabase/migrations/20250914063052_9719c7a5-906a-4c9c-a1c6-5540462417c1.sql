-- Create outfits table for community sharing
CREATE TABLE public.outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  style_tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create outfit likes table
CREATE TABLE public.outfit_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  outfit_id UUID REFERENCES public.outfits(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Enable Row Level Security
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;

-- Outfits policies
CREATE POLICY "Outfits are viewable by everyone" 
ON public.outfits FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own outfits" 
ON public.outfits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits" 
ON public.outfits FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits" 
ON public.outfits FOR DELETE 
USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Outfit likes policies
CREATE POLICY "Outfit likes are viewable by everyone" 
ON public.outfit_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like outfits" 
ON public.outfit_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike outfits" 
ON public.outfit_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Create functions for like counting
CREATE OR REPLACE FUNCTION public.increment_outfit_likes(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET likes_count = likes_count + 1 
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_outfit_likes(outfit_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.outfits 
  SET likes_count = GREATEST(likes_count - 1, 0) 
  WHERE id = outfit_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample outfit data with 2025 trending styles
INSERT INTO public.outfits (user_id, title, description, image_url, style_tags) VALUES
-- Use a placeholder user_id for demo data
((SELECT id FROM auth.users LIMIT 1), 'Acubi 韓系街頭風', '融合韓式街頭、賽博龐克與軟糜爛的新興美學風格', '/lovable-uploads/2c9565ef-37a9-420c-a328-4f4331bfaeb9.png', ARRAY['Acubi', '韓系', '街頭', '賽博龐克']),
((SELECT id FROM auth.users LIMIT 1), 'Y2K復古未來感', '千禧年復古風格結合未來主義元素', '/lovable-uploads/5acdebbb-cca2-43d2-860a-65f67ab9fdf7.png', ARRAY['Y2K', '復古', '未來感', '金屬']),
((SELECT id FROM auth.users LIMIT 1), 'Dark Academia 黑暗學院風', '充滿書卷氣的復古學院派穿搭', '/lovable-uploads/898fe503-567d-49ee-83fb-6d0ecd6f7352.png', ARRAY['Dark Academia', '學院風', '復古', '書卷氣']),
((SELECT id FROM auth.users LIMIT 1), 'Coquette 法式甜美風', '甜美優雅的法式浪漫穿搭風格', '/lovable-uploads/9ece6393-3076-4672-bd69-0e190839e36e.png', ARRAY['Coquette', '法式', '甜美', '浪漫']),
((SELECT id FROM auth.users LIMIT 1), 'Cottagecore 田園風', '回歸自然的鄉村田園穿搭風格', '/lovable-uploads/f1bce080-5ecf-4e8a-8113-4531cad0c21e.png', ARRAY['Cottagecore', '田園', '自然', '鄉村']);