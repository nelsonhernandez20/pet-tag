-- Script para corregir el error de múltiples relaciones entre qr_codes y pets
-- El problema es tener relaciones bidireccionales: pets.qr_code_id y qr_codes.pet_id
-- Solución: Eliminar qr_codes.pet_id ya que tenemos pets.qr_code_id

-- Eliminar la constraint problemática
ALTER TABLE public.qr_codes 
  DROP CONSTRAINT IF EXISTS qr_codes_pet_id_fkey;

-- Eliminar la columna pet_id de qr_codes (no es necesaria, tenemos qr_code_id en pets)
ALTER TABLE public.qr_codes 
  DROP COLUMN IF EXISTS pet_id;


