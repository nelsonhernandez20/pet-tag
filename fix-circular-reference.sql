-- Script para corregir la relación circular entre qr_codes y pets
-- Ejecuta esto en Supabase SQL Editor si ya creaste las tablas anteriormente

-- Eliminar la constraint actual si existe
ALTER TABLE public.qr_codes 
  DROP CONSTRAINT IF EXISTS qr_codes_pet_id_fkey;

-- Recrear la constraint con DEFERRABLE INITIALLY DEFERRED
-- Esto permite insertar/actualizar en cualquier orden sin errores de foreign key
ALTER TABLE public.qr_codes 
  ADD CONSTRAINT qr_codes_pet_id_fkey 
  FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;


