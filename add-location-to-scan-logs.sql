-- Script para agregar campos de ubicación a scan_logs
-- Ejecuta esto en Supabase SQL Editor

ALTER TABLE public.scan_logs 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE;

-- Índice para búsquedas por ubicación (opcional)
CREATE INDEX IF NOT EXISTS idx_scan_logs_location ON public.scan_logs(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;


