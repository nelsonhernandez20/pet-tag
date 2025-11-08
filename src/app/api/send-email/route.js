import { Resend } from 'resend'
import { NextResponse } from 'next/server'

// Inicializar Resend con la API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      to, 
      subject, 
      petName, 
      location 
    } = body

    // Validar que tenemos los datos necesarios
    if (!to || !petName) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Si no hay API key de Resend configurada, devolver error
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada')
      return NextResponse.json(
        { error: 'Servicio de email no configurado' },
        { status: 500 }
      )
    }

    // Construir el cuerpo del email con HTML
    const locationText = location 
      ? location.address 
        ? `📍 Ubicación: ${location.address}\n   Coordenadas: ${location.latitude}, ${location.longitude}`
        : `📍 Coordenadas: ${location.latitude}, ${location.longitude}`
      : '📍 Ubicación no disponible'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #4F46E5; }
            .location { background-color: #ECFDF5; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #10B981; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐾 Tu Mascota Ha Sido Encontrada</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>¡Buenas noticias! Tu mascota <strong>${petName}</strong> ha sido encontrada.</p>
              
              <div class="location">
                <h3 style="margin-top: 0; color: #059669;">📍 Ubicación de tu mascota</h3>
                ${location?.address ? `<p><strong>Dirección:</strong> ${location.address}</p>` : ''}
                ${location?.latitude && location?.longitude 
                  ? `<p><strong>Coordenadas:</strong> ${location.latitude}, ${location.longitude}</p>
                     <p><a href="https://www.google.com/maps?q=${location.latitude},${location.longitude}" target="_blank" style="color: #4F46E5; text-decoration: none; font-weight: bold;">📍 Ver en Google Maps</a></p>` 
                  : '<p>Ubicación no disponible</p>'}
              </div>

              <p>Alguien escaneó el código QR de tu mascota y compartió su ubicación contigo.</p>
              
              <p style="margin-top: 20px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
                <strong>💡 Sugerencia:</strong> Si no puedes ir inmediatamente, considera contactar a alguien cercano a esa ubicación para que te ayude.
              </p>
              
              <div class="footer">
                <p>Este email fue generado automáticamente cuando alguien escaneó el código QR de tu mascota.</p>
                <p>Tag Pet - Sistema de Identificación de Mascotas</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    // Enviar el email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Tag Pet <onboarding@resend.dev>',
      to: [to],
      subject: subject || `Tu mascota ${petName} ha sido encontrada`,
      html: htmlContent,
    })

    if (error) {
      console.error('Error al enviar email con Resend:', error)
      
      // Si es un error de validación (403), probablemente es porque no se puede enviar a otros destinatarios
      if (error.statusCode === 403 && error.message?.includes('testing emails')) {
        return NextResponse.json(
          { 
            error: 'Límite del plan gratuito de Resend',
            details: 'El plan gratuito de Resend solo permite enviar emails a tu propia dirección. Para enviar a otros destinatarios, necesitas verificar un dominio en resend.com/domains',
            resendError: error.message
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al enviar email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Email enviado exitosamente' 
    })

  } catch (error) {
    console.error('Error en API send-email:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}


