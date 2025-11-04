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
      finderContact, 
      message, 
      location 
    } = body

    // Validar que tenemos los datos necesarios
    if (!to || !petName || !finderContact) {
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
                <h3 style="margin-top: 0; color: #059669;">📍 Ubicación</h3>
                ${location?.address ? `<p><strong>Dirección:</strong> ${location.address}</p>` : ''}
                ${location?.latitude && location?.longitude 
                  ? `<p><strong>Coordenadas:</strong> ${location.latitude}, ${location.longitude}</p>
                     <p><a href="https://www.google.com/maps?q=${location.latitude},${location.longitude}" target="_blank" style="color: #4F46E5;">Ver en Google Maps</a></p>` 
                  : '<p>Ubicación no disponible</p>'}
              </div>

              <div class="info-box">
                <h3 style="margin-top: 0;">Información de Contacto</h3>
                <p><strong>Contacto del que encontró a tu mascota:</strong><br>${finderContact}</p>
                ${message ? `<p><strong>Mensaje:</strong><br>${message}</p>` : ''}
              </div>

              <p>Por favor contacta a la persona que encontró a tu mascota lo antes posible.</p>
              
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


