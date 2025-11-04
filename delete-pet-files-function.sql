-- Función para eliminar archivos del storage cuando se elimina una mascota
-- Ejecuta esto en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_pet_files()
RETURNS TRIGGER AS $$
DECLARE
  photo_path TEXT;
  pdf_path TEXT;
BEGIN
  -- Extraer path de la foto si existe
  IF OLD.photo_url IS NOT NULL THEN
    photo_path := substring(OLD.photo_url from 'pet-photos/[^?]*');
    IF photo_path IS NOT NULL THEN
      -- Eliminar del storage (esto se hace desde la aplicación)
      -- La eliminación real se maneja en el código de la aplicación
      RAISE NOTICE 'Foto a eliminar: %', photo_path;
    END IF;
  END IF;

  -- Extraer path del PDF si existe
  IF OLD.vaccine_pdf_url IS NOT NULL THEN
    pdf_path := substring(OLD.vaccine_pdf_url from 'vaccine-pdfs/[^?]*');
    IF pdf_path IS NOT NULL THEN
      RAISE NOTICE 'PDF a eliminar: %', pdf_path;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para ejecutar la función cuando se elimina una mascota
DROP TRIGGER IF EXISTS on_pet_deleted ON public.pets;
CREATE TRIGGER on_pet_deleted
  BEFORE DELETE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.delete_pet_files();

-- NOTA: La eliminación real de archivos del storage debe hacerse desde la aplicación
-- porque Supabase no puede eliminar archivos del storage directamente desde triggers.
-- El trigger solo registra qué archivos deben eliminarse.
-- La eliminación se hace en el código de la aplicación (dashboard/page.js handleDelete)


