-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de códigos QR únicos (se crean ANTES de asociarse a una cuenta)
CREATE TABLE public.qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT UNIQUE NOT NULL, -- Código único del QR
  is_associated BOOLEAN DEFAULT FALSE, -- Si está asociado a una cuenta
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- NO incluimos pet_id aquí para evitar relaciones circulares
  -- La relación se maneja desde pets.qr_code_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  associated_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de mascotas
CREATE TABLE public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  photo_url TEXT, -- URL de la foto de la mascota en storage
  vaccine_pdf_url TEXT, -- URL del PDF de vacunas en storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ya no necesitamos agregar una foreign key de qr_codes a pets
-- porque la relación está en pets.qr_code_id (una sola dirección)

-- Tabla de configuración de privacidad (qué mostrar/ocultar en el QR)
CREATE TABLE public.privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL UNIQUE,
  show_address BOOLEAN DEFAULT TRUE,
  show_phone BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT TRUE,
  show_name BOOLEAN DEFAULT TRUE,
  custom_message TEXT, -- Mensaje personalizado cuando alguien escanea el QR
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de escaneos (cuando alguien escanea un QR)
CREATE TABLE public.scan_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contact_method TEXT, -- 'email' o 'whatsapp'
  contact_info TEXT, -- email o teléfono del escaneador
  message_sent BOOLEAN DEFAULT FALSE
);

-- Storage bucket para PDFs de vacunas
-- Esto se debe crear manualmente en Supabase Dashboard > Storage

-- Índices para mejorar rendimiento
CREATE INDEX idx_qr_codes_code ON public.qr_codes(qr_code);
CREATE INDEX idx_qr_codes_user ON public.qr_codes(user_id);
CREATE INDEX idx_pets_user ON public.pets(user_id);
CREATE INDEX idx_pets_qr ON public.pets(qr_code_id);
CREATE INDEX idx_scan_logs_qr ON public.scan_logs(qr_code_id);
CREATE INDEX idx_scan_logs_pet ON public.scan_logs(pet_id);

-- RLS (Row Level Security) Policies

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies para qr_codes
-- Cualquiera puede leer QR codes (necesario para escanear sin estar autenticado)
CREATE POLICY "Anyone can read QR codes" ON public.qr_codes
  FOR SELECT USING (true);

-- Solo usuarios autenticados pueden insertar QR codes
-- NOTA: La aplicación tiene validación adicional en el frontend para solo permitir 
-- al usuario autorizado (neslonhernadnez335@gmail.com) generar códigos
CREATE POLICY "Authenticated users can insert QR codes" ON public.qr_codes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo usuarios autenticados pueden asociar QRs
CREATE POLICY "Authenticated users can update QR codes" ON public.qr_codes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies para pets
CREATE POLICY "Users can view own pets" ON public.pets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pets" ON public.pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pets" ON public.pets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pets" ON public.pets
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para privacy_settings
CREATE POLICY "Users can view privacy settings of own pets" ON public.privacy_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = privacy_settings.pet_id
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update privacy settings of own pets" ON public.privacy_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = privacy_settings.pet_id
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert privacy settings for own pets" ON public.privacy_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = privacy_settings.pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Policies para scan_logs (solo lectura de logs propios)
CREATE POLICY "Users can view scan logs of own pets" ON public.scan_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = scan_logs.pet_id
      AND pets.user_id = auth.uid()
    )
  );

-- Cualquiera puede insertar scan logs (cuando escanean un QR)
CREATE POLICY "Anyone can insert scan logs" ON public.scan_logs
  FOR INSERT WITH CHECK (true);

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_privacy_settings_updated_at
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

