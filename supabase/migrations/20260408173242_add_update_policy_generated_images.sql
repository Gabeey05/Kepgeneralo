/*
  # Add UPDATE policy for generated_images

  ## Changes
  - Adds an UPDATE policy so authenticated users can update their own images (e.g. set is_public = true)

  ## Security
  - Only the owner (user_id = auth.uid()) can update their own rows
*/

CREATE POLICY "Users can update own images"
  ON generated_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
