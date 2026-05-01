/*
  # Create generated_images and image_likes tables

  1. New Tables
    - `generated_images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `image_path` (text) - relative storage path OR fallback external URL
      - `prompt` (text) - the generation prompt
      - `is_public` (boolean, default false) - community feed visibility
      - `created_at` (timestamptz)

    - `image_likes`
      - `id` (uuid, primary key)
      - `image_id` (uuid, references generated_images)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - UNIQUE (image_id, user_id) to prevent double likes

  2. Security
    - RLS enabled on both tables
    - generated_images: users can read their own + all public; insert/update/delete own only
    - image_likes: authenticated users can read all; insert/delete own only

  3. Indexes
    - generated_images(user_id, created_at) for profile queries
    - generated_images(created_at) for explore feed
    - image_likes(image_id) for like counts
    - image_likes(user_id) for liked images queries
*/

CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_path text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own images"
  ON generated_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Anyone can view public images"
  ON generated_images FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY "Users can insert own images"
  ON generated_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own images"
  ON generated_images FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON generated_images FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS image_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id uuid REFERENCES generated_images(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (image_id, user_id)
);

ALTER TABLE image_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read likes"
  ON image_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON image_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON image_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_generated_images_user_created ON generated_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_created ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_public ON generated_images(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_likes_image ON image_likes(image_id);
CREATE INDEX IF NOT EXISTS idx_image_likes_user ON image_likes(user_id);
