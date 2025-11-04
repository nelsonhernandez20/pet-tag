// Configuración de URLs para QRs
export const getQRBaseUrl = () => {
  // Usar variable de entorno, si no está definida usar window.location.origin
  if (process.env.NEXT_PUBLIC_QR_BASE_URL) {
    return process.env.NEXT_PUBLIC_QR_BASE_URL
  }
  
  // Fallback: usar la URL actual (localhost en desarrollo, dominio en producción)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // En el servidor, intentar usar la URL del proceso o localhost
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

