-- Create a bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for receipts
CREATE POLICY "Allow public read access to receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Allow authenticated users to upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow users to delete their own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
