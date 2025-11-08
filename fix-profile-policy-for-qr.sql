-- Política para permitir leer perfiles cuando se escanea un QR
-- Esto permite que usuarios no autenticados puedan ver la información del dueño
-- cuando escanean el QR de una mascota

-- Primero, eliminar la política restrictiva si existe
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Crear política que permite ver el propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Crear política que permite leer perfiles de dueños de mascotas cuando se escanea un QR
-- Esto permite que cualquier usuario (incluso no autenticado) pueda ver el perfil
-- del dueño de una mascota asociada a un QR code
CREATE POLICY "Anyone can view profiles of pet owners via QR" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      INNER JOIN public.qr_codes ON pets.qr_code_id = qr_codes.id
      WHERE pets.user_id = profiles.id
      AND qr_codes.is_associated = true
    )
  );


