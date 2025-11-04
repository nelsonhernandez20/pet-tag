-- Script FORZADO para eliminar la relación bidireccional problemática
-- El error muestra que aún existe: qr_codes_pet_id_fkey
-- Ejecuta esto en Supabase SQL Editor

-- Paso 1: Eliminar la constraint que causa el problema
ALTER TABLE public.qr_codes 
  DROP CONSTRAINT IF EXISTS qr_codes_pet_id_fkey;

-- Paso 2: Eliminar la columna pet_id si existe
ALTER TABLE public.qr_codes 
  DROP COLUMN IF EXISTS pet_id;

-- Paso 3: Verificar que se eliminó (esto debería mostrar 0 filas)
SELECT 
  constraint_name, 
  table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'qr_codes'
AND constraint_name LIKE '%pet%';

-- Deberías ver que solo queda: pets_qr_code_id_fkey en la tabla pets
-- Y NO debería haber ninguna constraint de pet_id en qr_codes
