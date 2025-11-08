-- Política más simple para permitir leer perfiles cuando se escanea un QR
-- Esta política permite que CUALQUIERA pueda leer perfiles de usuarios que tienen mascotas asociadas a QRs

-- Primero, eliminar las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles of pet owners via QR" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles of pet owners" ON public.profiles;

-- Crear política que permite ver el propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política más permisiva: permitir leer cualquier perfil de usuarios que tienen mascotas
-- Esto es necesario para mostrar información del dueño cuando alguien escanea el QR
CREATE POLICY "Anyone can view profiles of pet owners" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.user_id = profiles.id
    )
  );

