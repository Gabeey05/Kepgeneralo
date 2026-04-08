/*
  # Create Generated Images Storage Bucket

  1. Storage Setup
    - Creates 'generated-images' bucket for storing AI-generated images
    - Configured as public bucket for easy image access

  2. Security Policies
    - INSERT: Service role only (edge function uploads on behalf of user)
    - SELECT: Anyone can view (public bucket)
    - DELETE: Authenticated users can delete their own images
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view generated images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'generated-images');

CREATE POLICY "Service role can upload generated images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Users can delete own generated images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
