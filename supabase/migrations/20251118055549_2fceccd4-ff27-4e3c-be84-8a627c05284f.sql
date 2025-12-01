-- Create storage bucket for tryon images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tryon-images', 'tryon-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload tryon images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tryon-images'
);

-- Allow public read access to tryon images
CREATE POLICY "Public read access to tryon images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tryon-images');

-- Allow users to update their own images
CREATE POLICY "Users can update tryon images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tryon-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete tryon images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tryon-images');