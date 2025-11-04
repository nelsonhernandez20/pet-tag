'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function QRScanPage() {
  const params = useParams()
  const qrCode = params?.qrCode
  const [loading, setLoading] = useState(true)
  const [qrData, setQrData] = useState(null)
  const [ownerData, setOwnerData] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [sendingLocation, setSendingLocation] = useState(false)

  useEffect(() => {
    if (qrCode) {
      fetchQRData()
    }
  }, [qrCode])

  // Obtener ubicación automáticamente cuando se carga la página
  useEffect(() => {
    if (ownerData && !location && !gettingLocation && !loading) {
      getLocation()
    }
  }, [ownerData, loading])

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
            petPhoto: pet.photo_url || null,
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

  // Función para enviar ubicación por correo
  const handleSendLocationByEmail = async () => {
    if (!ownerData?.email) return
    
    setSendingLocation(true)
    
    try {
      // Esperar a que se obtenga la ubicación si está en proceso
      if (gettingLocation) {
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
          }, 10000)
        })
      }

      if (!location) {
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación.')
        setSendingLocation(false)
        return
      }

      // Buscar pet_id
      let petId = null
      if (qrData.is_associated) {
        const { data: pet } = await supabase
          .from('pets')
          .select('id')
          .eq('qr_code_id', qrData.id)
          .single()
        petId = pet?.id || null
      }

      // Enviar email con ubicación
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ownerData.email,
          subject: `Tu mascota ${ownerData.petName} ha sido encontrada`,
          petName: ownerData.petName,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || null,
          },
        }),
      })

      const emailResult = await emailResponse.json()
      
      // Registrar el escaneo
      const scanLogData = {
        qr_code_id: qrData.id,
        pet_id: petId,
        contact_method: 'email',
        message_sent: emailResponse.ok && emailResult.success,
        email_sent: emailResponse.ok && emailResult.success,
        latitude: location.latitude,
        longitude: location.longitude,
        location_address: location.address || null,
      }
      
      await supabase.from('scan_logs').insert(scanLogData)

      if (emailResponse.ok && emailResult.success) {
        setSubmitted(true)
        alert('¡Ubicación enviada! El dueño recibió un correo con la ubicación de su mascota.')
      } else {
        alert('Error al enviar el correo. Por favor, intenta nuevamente.')
        setSendingLocation(false)
      }
    } catch (error) {
      console.error('Error enviando ubicación por email:', error)
      alert('Error al enviar el correo. Por favor, intenta nuevamente.')
      setSendingLocation(false)
    }
  }

  // Función para enviar ubicación por WhatsApp
  const handleSendLocationByWhatsApp = async () => {
    if (!ownerData?.phone) return
    
    setSendingLocation(true)
    
    try {
      // Esperar a que se obtenga la ubicación si está en proceso
      if (gettingLocation) {
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
          }, 10000)
        })
      }

      if (!location) {
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación.')
        setSendingLocation(false)
        return
      }

      // Buscar pet_id
      let petId = null
      if (qrData.is_associated) {
        const { data: pet } = await supabase
          .from('pets')
          .select('id')
          .eq('qr_code_id', qrData.id)
          .single()
        petId = pet?.id || null
      }

      // Generar mensaje de WhatsApp con ubicación
      let whatsappMessage = `Hola, encontré a tu mascota ${ownerData.petName}. `
      
      if (location.address) {
        whatsappMessage += `📍 Ubicación: ${location.address} `
      }
      whatsappMessage += `(Coordenadas: ${location.latitude}, ${location.longitude})`

      const whatsappUrl = `https://wa.me/${ownerData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
      
      // Registrar el escaneo
      const scanLogData = {
        qr_code_id: qrData.id,
        pet_id: petId,
        contact_method: 'whatsapp',
        message_sent: true,
        latitude: location.latitude,
        longitude: location.longitude,
        location_address: location.address || null,
      }
      
      await supabase.from('scan_logs').insert(scanLogData)

      window.open(whatsappUrl, '_blank')
      setSubmitted(true)
      setSendingLocation(false)
    } catch (error) {
      console.error('Error enviando ubicación por WhatsApp:', error)
      alert('Error al abrir WhatsApp. Por favor, intenta nuevamente.')
      setSendingLocation(false)
    }
  }

  // Función para escribir directamente por WhatsApp
  const handleWriteWhatsApp = () => {
    if (!ownerData?.phone) return
    
    const whatsappMessage = `Hola, encontré a tu mascota ${ownerData.petName}.`
    const whatsappUrl = `https://wa.me/${ownerData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    
    // Registrar el escaneo básico
    const scanLogData = {
      qr_code_id: qrData.id,
      pet_id: null,
      contact_method: 'whatsapp',
      message_sent: false,
    }
    
    supabase.from('scan_logs').insert(scanLogData)
    
    window.open(whatsappUrl, '_blank')
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
        {!submitted ? (
          <>
            {/* Foto de la mascota */}
            {ownerData?.petPhoto && (
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#4646FA]">
                  <Image
                    src={ownerData.petPhoto}
                    alt={ownerData.petName}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Nombre de la mascota */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2 text-[#4646FA]">
                {ownerData?.petName}
              </h1>
              <p className="text-zinc-600 text-sm">
                Mascota encontrada
              </p>
            </div>

            {/* Mensaje personalizado del dueño */}
            {ownerData?.customMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-[#4646FA] text-center">
                  {ownerData.customMessage}
                </p>
              </div>
            )}

            {/* Estado de ubicación */}
            {gettingLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4646FA] text-center">
                  📍 Obteniendo tu ubicación...
                </p>
              </div>
            )}

            {location && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 text-center">
                  ✅ Ubicación obtenida
                  {location.address && (
                    <span className="block mt-1 text-xs">{location.address}</span>
                  )}
                </p>
              </div>
            )}

            {locationError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ {locationError}
                </p>
              </div>
            )}

            {/* Información del dueño */}
            <div className="bg-[#F3F3F3] rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-zinc-700 mb-3">Información del dueño:</h3>
              <div className="space-y-2 text-sm">
                {ownerData?.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">📧</span>
                    <span className="text-zinc-700">{ownerData.email}</span>
                  </div>
                )}
                {ownerData?.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">📱</span>
                    <span className="text-zinc-700">{ownerData.phone}</span>
                  </div>
                )}
                {ownerData?.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-zinc-500">📍</span>
                    <span className="text-zinc-700">{ownerData.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              {ownerData?.email && (
                <button
                  onClick={handleSendLocationByEmail}
                  disabled={sendingLocation || gettingLocation || !location}
                  className="w-full px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md font-medium flex items-center justify-center gap-2"
                >
                  📧 Enviar ubicación por correo
                </button>
              )}

              {ownerData?.phone && (
                <>
                  <button
                    onClick={handleSendLocationByWhatsApp}
                    disabled={sendingLocation || gettingLocation || !location}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md font-medium flex items-center justify-center gap-2"
                  >
                    📱 Enviar ubicación por WhatsApp
                  </button>

                  <button
                    onClick={handleWriteWhatsApp}
                    disabled={sendingLocation}
                    className="w-full px-4 py-3 border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center justify-center gap-2"
                  >
                    💬 Escribir por WhatsApp
                  </button>
                </>
              )}

              {!ownerData?.email && !ownerData?.phone && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No hay información de contacto disponible del dueño.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-600 mb-4 text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold mb-2">
              ¡Gracias!
            </h2>
            <p className="text-zinc-600 mb-6">
              El dueño ha sido notificado sobre su mascota.
            </p>
            <Link
              href="/"
              className="inline-block text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200"
            >
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

