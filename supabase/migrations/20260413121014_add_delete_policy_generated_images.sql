/*
  # Add DELETE policy for generated_images

  ## Changes
  - Adds a DELETE RLS policy so users can only delete their own images

  ## Security
  - Only the owner (auth.uid() = user_id) can delete their image
*/

CREATE POLICY "Users can delete own images"
  ON generated_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
