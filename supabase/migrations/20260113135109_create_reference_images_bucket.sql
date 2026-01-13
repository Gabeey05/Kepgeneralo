/*
  # Create Reference Images Storage Bucket

  1. Storage Setup
    - Creates 'reference-images' bucket for storing user-uploaded reference images
    - Configured as public bucket for easy image access
    - File size limit: 10MB
    - Allowed file types: image/jpeg, image/png, image/webp, image/gif

  2. Security Policies
    - **INSERT Policy**: Authenticated users can upload images to their own folder
      - Policy name: "Users can upload reference images"
      - Restricts uploads to authenticated users only
      - Files are organized by user ID in folder structure
    
    - **SELECT Policy**: Anyone can view reference images
      - Policy name: "Anyone can view reference images"
      - Allows public read access to all images in the bucket
      - Required for public URL access
    
    - **DELETE Policy**: Users can delete only their own images
      - Policy name: "Users can delete own images"
      - Restricts deletion to files in user's own folder
      - Uses auth.uid() to match folder ownership

  3. Folder Structure
    - Images stored as: {user_id}/{timestamp}.{ext}
    - Ensures user isolation and prevents naming conflicts
*/

-- Create the storage bucket for reference images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload images to their own folder
CREATE POLICY "Users can upload reference images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reference-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view reference images (public bucket)
CREATE POLICY "Anyone can view reference images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reference-images');

-- Policy: Users can delete only their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'reference-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);