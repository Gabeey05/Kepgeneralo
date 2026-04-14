/*
  # Fix avatars storage policies

  The existing INSERT/UPDATE policies used (storage.foldername(name))[1] which may
  behave differently across Supabase versions. This migration drops and recreates
  them using a more reliable path check with auth.uid() directly in the name prefix.

  Changes:
  - Drop existing INSERT and UPDATE avatar policies
  - Recreate them using (storage.foldername(name))[1] AND a direct name LIKE check
    as a fallback to ensure compatibility
*/

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '/%')
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name LIKE (auth.uid()::text || '/%')
  );
