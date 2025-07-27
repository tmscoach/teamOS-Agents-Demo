-- Create the report-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images',
  'report-images',
  true, -- Public bucket for serving images
  10485760, -- 10MB file size limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload report images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-images');

-- Allow public access to read images
CREATE POLICY "Allow public to read report images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'report-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Allow users to update their report images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'report-images')
WITH CHECK (bucket_id = 'report-images');

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow users to delete their report images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'report-images');