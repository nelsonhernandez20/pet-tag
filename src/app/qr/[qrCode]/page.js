'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function QRScanPage() {
  const params = useParams()
  const qrCode = params?.qrCode
  const [loading, setLoading] = useState(true)
  const [qrData, setQrData] = useState(null)
  const [ownerData, setOwnerData] = useState(null)
  const [contactMethod, setContactMethod] = useState('email')
  const [contactInfo, setContactInfo] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [includeLocation, setIncludeLocation] = useState(true)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    if (qrCode) {
      fetchQRData()
    }
  }, [qrCode])

  // Obtener ubicación solo si el usuario quiere incluirla
  useEffect(() => {
    if (ownerData && includeLocation && !location && !gettingLocation && !loading) {
      getLocation()
    } else if (!includeLocation && location) {
      // Si desmarca la opción, limpiar la ubicación
      setLocation(null)
      setLocationError(null)
    }
  }, [ownerData, loading, includeLocation])

  const getLocation = async () => {
    setGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en tu navegador')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Intentar obtener la dirección usando reverse geocoding
        let address = null
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || ''}&language=es`
          )
          if (response.ok) {
            const data = await response.json()
            if (data.results && data.results.length > 0) {
              address = data.results[0].formatted
            }
          }
        } catch (err) {
          console.log('No se pudo obtener la dirección:', err)
        }

        setLocation({
          latitude,
          longitude,
          address,
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        setLocationError('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación en tu navegador.')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const fetchQRData = async () => {
    try {
      console.log('Buscando QR code:', qrCode)
      
      // Buscar el QR code (sin hacer join con pets porque la relación es al revés)
      const { data: qrCodeData, error: qrError } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_code', qrCode)
        .single()

      console.log('Resultado de búsqueda:', { qrCodeData, qrError })

      if (qrError) {
        console.error('Error al buscar QR:', qrError)
        // Si es un error de "no encontrado", tratarlo como no encontrado
        if (qrError.code === 'PGRST116') {
          setQrData({ notFound: true })
          setLoading(false)
          return
        }
        throw qrError
      }

      if (!qrCodeData) {
        console.log('QR no encontrado en base de datos')
        setQrData({ notFound: true })
        setLoading(false)
        return
      }

      console.log('QR encontrado:', qrCodeData)
      console.log('is_associated:', qrCodeData.is_associated)

      setQrData(qrCodeData)

      // Si está asociado, buscar la mascota usando qr_code_id
      if (qrCodeData.is_associated) {
        // Buscar la mascota que tiene este qr_code_id
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('*, privacy_settings(*)')
          .eq('qr_code_id', qrCodeData.id)
          .single()

        if (petError && petError.code !== 'PGRST116') {
          console.error('Error al buscar mascota:', petError)
        }

        if (petData) {
          const pet = petData
          const privacy = pet.privacy_settings?.[0] || pet.privacy_settings?.[0]

          // Obtener datos del perfil del usuario
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, phone, address')
            .eq('id', pet.user_id)
            .single()

          // Construir datos del dueño según configuración de privacidad
          const owner = {
            petName: privacy?.show_name !== false ? pet.name : 'Mascota',
            email: privacy?.show_email !== false ? profileData?.email : null,
            phone: privacy?.show_phone !== false ? profileData?.phone : null,
            address: privacy?.show_address !== false ? profileData?.address : null,
            customMessage: privacy?.custom_message || null,
          }

          setOwnerData(owner)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching QR data:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      
      // Si es un error de "no encontrado", mostrarlo como tal
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        setQrData({ notFound: true })
      } else {
        setQrData({ error: true, errorMessage: error.message })
      }
      setLoading(false)
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)

    try {
      // Buscar pet_id desde pets usando qr_code_id
      let petId = null
      if (qrData.is_associated) {
        const { data: pet } = await supabase
          .from('pets')
          .select('id')
          .eq('qr_code_id', qrData.id)
          .single()
        petId = pet?.id || null
      }

      // Si se está obteniendo la ubicación y el usuario quiere incluirla, esperar
      if (includeLocation && gettingLocation) {
        await new Promise((resolve) => {
          const checkLocation = setInterval(() => {
            if (!gettingLocation) {
              clearInterval(checkLocation)
              resolve()
            }
          }, 500)
          setTimeout(() => {
            clearInterval(checkLocation)
            resolve()
          }, 10000) // Timeout de 10 segundos
        })
      }

      // Determinar la ubicación a usar (solo si el usuario quiere incluirla)
      const locationToUse = includeLocation ? location : null

      // Registrar el escaneo con ubicación (si se incluyó)
      const scanLogData = {
        qr_code_id: qrData.id,
        pet_id: petId,
        contact_method: contactMethod,
        contact_info: contactInfo,
        message_sent: false,
      }

      if (locationToUse) {
        scanLogData.latitude = locationToUse.latitude
        scanLogData.longitude = locationToUse.longitude
        scanLogData.location_address = locationToUse.address || null
      }

      let emailSent = false

      // Solo enviar email si el método es email (no si es WhatsApp)
      if (contactMethod === 'email' && ownerData?.email) {
        try {
          const emailResponse = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: ownerData.email,
              subject: `Tu mascota ${ownerData.petName} ha sido encontrada`,
              petName: ownerData.petName,
              finderContact: contactInfo,
              message: message || null,
              location: locationToUse ? {
                latitude: locationToUse.latitude,
                longitude: locationToUse.longitude,
                address: locationToUse.address || null,
              } : null,
            }),
          })

          const emailResult = await emailResponse.json()
          
          if (emailResponse.ok && emailResult.success) {
            emailSent = true
            scanLogData.message_sent = true
            scanLogData.email_sent = true
          } else {
            console.error('Error al enviar email:', emailResult.error)
            alert('Se registró tu contacto, pero hubo un error al enviar el email. Por favor, intenta contactar directamente.')
          }
        } catch (emailError) {
          console.error('Error al llamar API de email:', emailError)
          alert('Se registró tu contacto, pero hubo un error al enviar el email. Por favor, intenta contactar directamente.')
        }
      } else if (contactMethod === 'whatsapp' && ownerData?.phone) {
        // Generar enlace de WhatsApp (NO enviar email, ahorrar emails de Resend)
        let whatsappMessage = `Hola, encontré a tu mascota ${ownerData.petName}. `
        
        if (locationToUse) {
          if (locationToUse.address) {
            whatsappMessage += `📍 Ubicación: ${locationToUse.address} `
          }
          whatsappMessage += `(Coordenadas: ${locationToUse.latitude}, ${locationToUse.longitude}) `
        }
        
        whatsappMessage += `Mi información de contacto: ${contactInfo}. `
        
        if (message) {
          whatsappMessage += `Mensaje: ${message}`
        }

        const whatsappUrl = `https://wa.me/${ownerData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
        
        window.open(whatsappUrl, '_blank')
        scanLogData.message_sent = true
      }

      // Registrar el escaneo en la base de datos
      await supabase.from('scan_logs').insert(scanLogData)

      if (contactMethod === 'email') {
        if (emailSent) {
          const locationMsg = locationToUse ? ' con tu información de contacto y la ubicación' : ' con tu información de contacto'
          alert(`¡Gracias! Se ha enviado un correo al dueño de la mascota${locationMsg}.`)
        }
      } else {
        alert('¡Gracias! Se ha abierto WhatsApp para que puedas contactar al dueño.')
      }
    } catch (error) {
      console.error('Error submitting contact:', error)
      alert('Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.')
      setSubmitted(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  // Mostrar error si hay uno
  if (qrData?.error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-zinc-600 mb-6">
            {qrData.errorMessage || 'Hubo un error al buscar el código QR.'}
          </p>
          {qrCode && (
            <div className="mb-6 p-4 bg-zinc-100 rounded-lg">
              <p className="text-sm text-zinc-600 mb-2">
                Código buscado:
              </p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                {qrCode}
              </code>
            </div>
          )}
          <Link href="/" className="text-[#4646FA] hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  // Mostrar "no encontrado" solo si realmente no existe
  if (qrData?.notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Código QR no encontrado</h1>
          <p className="text-zinc-600 mb-6">
            Este código QR no está registrado en el sistema.
          </p>
          {qrCode && (
            <div className="mb-6 p-4 bg-zinc-100 rounded-lg">
              <p className="text-sm text-zinc-600 mb-2">
                Código buscado:
              </p>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                {qrCode}
              </code>
            </div>
          )}
          <Link href="/" className="text-[#4646FA] hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  // Si qrData existe pero no está asociado, mostrar opción de asociar
  if (qrData && !qrData.is_associated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-slate-200">
          <h1 className="text-2xl font-bold mb-4 text-center">
            Código QR Nuevo
          </h1>
          <p className="text-zinc-600 mb-6 text-center">
            Este código QR no está asociado a ninguna cuenta. 
            Si eres el dueño de la mascota, puedes asociarlo a tu cuenta.
          </p>
          <div className="space-y-4">
            <Link
              href={`/associate-qr?code=${qrCode}`}
              className="block w-full text-center px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#4646FA] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium"
            >
              Asociar este QR a mi cuenta
            </Link>
            <Link
              href="/auth/login"
              className="block w-full text-center px-4 py-3 border border-zinc-300 rounded-lg hover:bg-zinc-100"
            >
              Iniciar sesión primero
            </Link>
            <Link
              href="/"
              className="block w-full text-center text-zinc-600 hover:underline text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Mascota Encontrada
          </h1>
          <p className="text-zinc-600">
            {ownerData?.petName}
          </p>
        </div>

        {ownerData?.customMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-[#4646FA]">
              {ownerData.customMessage}
            </p>
          </div>
        )}

        {!submitted ? (
          <>
            <p className="text-zinc-600 mb-6 text-center">
              Si encontraste esta mascota, por favor completa el formulario para contactar al dueño.
            </p>

            {includeLocation && gettingLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4646FA]">
                  📍 Obteniendo tu ubicación...
                </p>
              </div>
            )}

            {includeLocation && location && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  ✅ Ubicación obtenida
                  {location.address && `: ${location.address}`}
                </p>
              </div>
            )}

            {includeLocation && locationError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ {locationError}
                </p>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Método de Contacto
                </label>
                <select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
                >
                  <option value="email">Correo Electrónico</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {contactMethod === 'email' ? 'Tu Correo Electrónico' : 'Tu Número de WhatsApp'}
                </label>
                <input
                  type={contactMethod === 'email' ? 'email' : 'tel'}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
                />
              </div>

              <div className="flex items-start space-x-3 p-4 bg-[#F3F3F3] rounded-lg">
                <input
                  type="checkbox"
                  id="includeLocation"
                  checked={includeLocation}
                  onChange={(e) => setIncludeLocation(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#4646FA] border-zinc-300 rounded focus:ring-[#4646FA]"
                />
                <label htmlFor="includeLocation" className="text-sm text-zinc-700">
                  <span className="font-medium">Incluir mi ubicación</span>
                  <p className="text-xs text-zinc-500 mt-1">
                    {contactMethod === 'email' 
                      ? 'El dueño recibirá un email con tu ubicación (usa 1 email de Resend)'
                      : 'La ubicación se incluirá en el mensaje de WhatsApp (gratis)'}
                  </p>
                </label>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#4646FA] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium"
              >
                {contactMethod === 'email' ? 'Enviar Correo' : 'Abrir WhatsApp'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-600 mb-4 text-2xl">
              ✓
            </div>
            <h2 className="text-xl font-bold mb-2">
              ¡Gracias!
            </h2>
            <p className="text-zinc-600 mb-6">
              Tu información ha sido enviada al dueño de la mascota.
            </p>
            <Link
              href="/"
              className="text-[#4646FA] hover:text-[#4646FA] font-medium transition-colors duration-200"
            >
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

