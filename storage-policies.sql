-- Políticas de Storage para Supabase
-- Ejecuta esto en Supabase SQL Editor después de crear los buckets

-- ============================================
-- BUCKET: vaccine-pdfs
-- ============================================

-- Política de lectura pública para PDFs de vacunas
CREATE POLICY "Public Access Vaccine PDFs" ON storage.objects
  FOR SELECT USING (bucket_id = 'vaccine-pdfs');

-- Política para inserción de PDFs (solo usuarios autenticados)
CREATE POLICY "Authenticated users can upload Vaccine PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vaccine-pdfs' 
    AND auth.role() = 'authenticated'
  );

-- Política para actualización de PDFs (solo el propietario)
CREATE POLICY "Users can update own Vaccine PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vaccine-pdfs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para eliminación de PDFs (solo el propietario)
CREATE POLICY "Users can delete own Vaccine PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vaccine-pdfs' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- BUCKET: pet-photos
-- ============================================

-- Política de lectura pública para fotos de mascotas
CREATE POLICY "Public Access Pet Photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'pet-photos');

-- Política para inserción de fotos (solo usuarios autenticados)
CREATE POLICY "Authenticated users can upload Pet Photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-photos' 
    AND auth.role() = 'authenticated'
  );

-- Política para actualización de fotos (solo el propietario)
CREATE POLICY "Users can update own Pet Photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pet-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para eliminación de fotos (solo el propietario)
CREATE POLICY "Users can delete own Pet Photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pet-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


