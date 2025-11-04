-- Script para agregar el campo photo_url a la tabla pets
-- Ejecuta esto en Supabase SQL Editor si ya tienes la tabla creada

ALTER TABLE public.pets 
  ADD COLUMN IF NOT EXISTS photo_url TEXT;


