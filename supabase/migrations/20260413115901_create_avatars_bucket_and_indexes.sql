/*
  # Create avatars storage bucket and add performance indexes

  1. Storage
    - Creates 'avatars' bucket for profile pictures (public, 5MB max, images only)
    - SELECT: anyone can view avatars
    - INSERT: authenticated users can upload to their own folder
    - UPDATE: authenticated users can update their own avatar
    - DELETE: authenticated users can delete their own avatar

  2. Indexes
    - Index on generated_images(user_id, created_at) for profile queries
    - Index on generated_images(created_at) for activity heatmap queries
    - Index on image_likes(user_id) for liked images queries
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE INDEX IF NOT EXISTS idx_generated_images_user_created ON generated_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_likes_user ON image_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_image_likes_image ON image_likes(image_id);
