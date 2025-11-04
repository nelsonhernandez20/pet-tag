# Configuración de Tag Pet

## Pasos de Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://obtjvnqipccbesupdtep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idGp2bnFpcGNjYmVzdXBkdGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NTc3MTgsImV4cCI6MjA3NzQzMzcxOH0.XKwSul6_lzAmZoS-g6NDR34Ox9p75lZTZKMKxC_XMss
NEXT_PUBLIC_QR_BASE_URL=https://04376dfd4b79.ngrok-free.app

# Resend (para envío de emails)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Tag Pet <onboarding@resend.dev>

# Opcional: OpenCage Geocoding (para obtener direcciones desde coordenadas)
# Si no lo configuras, solo se guardarán las coordenadas
NEXT_PUBLIC_OPENCAGE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

**Notas sobre las variables:**
- `NEXT_PUBLIC_QR_BASE_URL`: URL base que se usará en los códigos QR. Puedes usar:
  - Una URL de ngrok (para desarrollo/producción temporal)
  - El dominio de producción cuando despliegues la aplicación
  - `http://localhost:3000` para desarrollo local (aunque esto limitará el acceso desde otros dispositivos)
- `RESEND_API_KEY`: API key de Resend para enviar emails. Obtén una en [resend.com](https://resend.com)
- `RESEND_FROM_EMAIL`: Email desde el cual se enviarán los correos. Debe estar verificado en Resend.
- `NEXT_PUBLIC_OPENCAGE_API_KEY`: (Opcional) API key de OpenCage para convertir coordenadas en direcciones. Si no lo configuras, solo se guardarán las coordenadas.

### 2. Base de Datos en Supabase

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Copia y pega todo el contenido del archivo `supabase-schema.sql`
5. Ejecuta el script

### 3. Storage en Supabase

Necesitas crear dos buckets de storage:

#### Bucket para PDFs de vacunas:

1. En el Dashboard de Supabase, ve a "Storage"
2. Crea un nuevo bucket llamado `vaccine-pdfs`
3. Configura las políticas de acceso usando el archivo `storage-policies.sql` (ver abajo)

#### Bucket para fotos de mascotas:

1. En el Dashboard de Supabase, ve a "Storage"
2. Crea un nuevo bucket llamado `pet-photos`
3. Configura las políticas de acceso usando el archivo `storage-policies.sql` (ver abajo)

#### ⚠️ IMPORTANTE: Políticas de Storage

**Opción 1 (Recomendada):** Ejecuta el archivo completo `storage-policies.sql` en Supabase SQL Editor. 
Este archivo tiene nombres únicos para cada política y evita conflictos.

**Opción 2:** Si ya ejecutaste políticas con nombres genéricos y obtienes errores de duplicados:

1. Ve a Storage en Supabase Dashboard
2. Haz clic en "Policies" en cada bucket
3. Elimina las políticas existentes que tengan nombres duplicados
4. Luego ejecuta `storage-policies.sql` completo

### 4. Configurar Resend para Envío de Emails

1. **Crear cuenta en Resend:**
   - Ve a [resend.com](https://resend.com) y crea una cuenta gratuita
   - El plan gratuito incluye 3,000 emails/mes

2. **Obtener API Key:**
   - En el dashboard de Resend, ve a "API Keys"
   - Crea una nueva API key
   - Copia la API key y agrégalo a `.env.local` como `RESEND_API_KEY`

3. **Verificar dominio (opcional):**
   - Para producción, deberás verificar tu dominio en Resend
   - Para desarrollo, puedes usar `onboarding@resend.dev` (ya configurado por defecto)
   - Si quieres usar tu propio email, agrégalo como `RESEND_FROM_EMAIL` en `.env.local`

4. **Instalar dependencias:**
   ```bash
   npm install
   ```

### 5. Agregar Campos de Ubicación a la Base de Datos

1. Ve al SQL Editor de Supabase
2. Ejecuta el script `add-location-to-scan-logs.sql`
3. Esto agregará los campos `latitude`, `longitude`, `location_address` y `email_sent` a la tabla `scan_logs`

### 6. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Flujo de Uso

### Para el Dueño de la Mascota:

1. **Generar o Obtener un Código QR:**
   - Opción A: Generar un código QR desde `/generate-qr`
   - Opción B: Comprar un collar con código QR en una veterinaria

2. **Asociar el Código QR:**
   - Escanear el código QR o ir a `/associate-qr?code=CODIGO_QR`
   - Iniciar sesión o registrarse
   - Seleccionar una mascota existente o crear una nueva
   - El QR quedará asociado a la cuenta

3. **Completar Información de la Mascota:**
   - Ir al Dashboard
   - Agregar/editar información de la mascota (nombre, raza, edad, PDF de vacunas)

4. **Configurar Privacidad:**
   - Ir a "Configurar Privacidad" en la tarjeta de la mascota
   - Decidir qué información mostrar (dirección, teléfono, email, nombre)
   - Agregar un mensaje personalizado

5. **Completar Perfil:**
   - Ir a "Mi Perfil" en el dashboard
   - Agregar teléfono y dirección (necesario para que funcione el contacto)

### Para Quien Encuentra una Mascota:

1. Escanear el código QR del collar
2. Ver la información disponible de la mascota
3. Completar el formulario con su información de contacto
4. Elegir método de contacto (email o WhatsApp)
5. El sistema enviará/abrirá el contacto con el dueño

## Características Implementadas

✅ Sistema de autenticación (registro/login)  
✅ Generación de códigos QR únicos  
✅ Asociación de QRs sin necesidad de registro previo  
✅ Gestión de múltiples mascotas por usuario  
✅ Información de mascotas (nombre, raza, edad)  
✅ Subida de PDFs de control de vacunas  
✅ Visualización de códigos QR  
✅ Descarga de códigos QR  
✅ Sistema de privacidad (mostrar/ocultar datos)  
✅ Contacto por email y WhatsApp  
✅ Registro de escaneos con ubicación  
✅ Página pública para escanear QRs  
✅ Geolocalización automática al escanear QR  
✅ Envío de emails con ubicación usando Resend  
✅ Subida y captura de fotos de mascotas  

## Notas Importantes

- **Envío de Emails:** El sistema usa Resend para enviar emails. El plan gratuito permite 3,000 emails/mes. Si necesitas más, puedes actualizar a un plan pagado ($20/mes por 10,000 emails).
- **Geolocalización:** El sistema obtiene automáticamente la ubicación del dispositivo cuando alguien escanea un QR. Si configuras OpenCage API Key, también se obtendrá la dirección correspondiente.
- **Códigos QR:** Los códigos QR se generan en la base de datos y se muestran visualmente. Puedes descargarlos e imprimirlos para crear los collares físicos.
- **Venta de Collares:** El sistema permite que los veterinarios generen códigos QR y los vendan físicamente, luego los clientes los asocian a sus cuentas.


