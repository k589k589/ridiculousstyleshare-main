-- Create storage bucket for outfit images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('outfit-images', 'outfit-images', true);

-- Create storage policies for outfit images
CREATE POLICY "Outfit images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'outfit-images');

CREATE POLICY "Users can upload their own outfit images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'outfit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own outfit images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'outfit-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own outfit images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'outfit-images' AND auth.uid()::text = (storage.foldername(name))[1]);