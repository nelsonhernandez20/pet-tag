-- Políticas de Storage SOLO para pet-photos
-- Ejecuta esto en Supabase SQL Editor después de crear el bucket pet-photos

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


