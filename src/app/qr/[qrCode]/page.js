'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaWhatsapp,
  FaLocationArrow,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPaw,
  FaFilePdf,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaPaperPlane,
  FaArrowLeft,
} from 'react-icons/fa'

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
  const [showVaccinePdf, setShowVaccinePdf] = useState(false)

  useEffect(() => {
    if (qrCode) {
      fetchQRData()
    }
  }, [qrCode])

const locationRef = useRef(location)
const gettingLocationRef = useRef(gettingLocation)

useEffect(() => {
  locationRef.current = location
}, [location])

useEffect(() => {
  gettingLocationRef.current = gettingLocation
}, [gettingLocation])

const waitWhileGettingLocation = () =>
  new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      if (!gettingLocationRef.current) {
        resolve(locationRef.current)
        return
      }
      if (Date.now() - start > 10000) {
        resolve(locationRef.current)
        return
      }
      setTimeout(check, 200)
    }
    check()
  })

const getLocation = useCallback(async () => {
  if (gettingLocationRef.current) {
    return await waitWhileGettingLocation()
  }

  setGettingLocation(true)
  setLocationError(null)

  if (!navigator.geolocation) {
    setLocationError('La geolocalización no está disponible en tu navegador.')
    setGettingLocation(false)
    return null
  }

  const result = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        let address = null
        try {
          const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY || ''
          if (apiKey) {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}&language=es`
            )
            if (response.ok) {
              const data = await response.json()
              if (data.results && data.results.length > 0) {
                address = data.results[0].formatted
              }
            }
          }
        } catch (err) {
          console.log('No se pudo obtener la dirección:', err)
        }

        const locationData = {
          latitude,
          longitude,
          address,
        }

        setLocation(locationData)
        resolve(locationData)
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error)
        setLocationError('No se pudo obtener tu ubicación. Permite el acceso desde tu navegador e inténtalo nuevamente.')
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })

  setGettingLocation(false)
  return result
}, [])

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
          const rawPrivacy = Array.isArray(pet.privacy_settings)
            ? pet.privacy_settings[0]
            : pet.privacy_settings
          const privacy = rawPrivacy || {}

          console.log('Pet data:', pet)
          console.log('Privacy settings:', privacy)

          // Obtener datos del perfil del usuario
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email, phone, address')
            .eq('id', pet.user_id)
            .single()

          console.log('Profile data:', profileData)
          console.log('Profile error:', profileError)

          // Obtener datos del perfil
          let email = null
          let phone = null
          let address = null

          if (profileData) {
            email = profileData.email
            phone = profileData.phone
            address = profileData.address
          } else if (profileError) {
            console.error('Error obteniendo perfil:', profileError)
            // Si no hay perfil, el email/phone/address serán null
          }

          // Construir datos del dueño según configuración de privacidad
          const owner = {
            petName: privacy?.show_name !== false ? pet.name : 'Mascota',
            breed: pet.breed || null,
            age: pet.age || null,
            petPhoto: pet.photo_url || null,
            email: privacy?.show_email ? email : null,
            phone: privacy?.show_phone ? phone : null,
            address: privacy?.show_address ? address : null,
            customMessage: privacy?.custom_message || null,
            vaccinePdf: pet.vaccine_pdf_url || null,
          }

          console.log('Owner data:', owner)
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
      const currentLocation = locationRef.current || await getLocation()

      if (!currentLocation) {
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso y vuelve a intentar.')
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
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: currentLocation.address || null,
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
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_address: currentLocation.address || null,
      }
      
      await supabase.from('scan_logs').insert(scanLogData)

      if (emailResponse.ok && emailResult.success) {
        setSubmitted(true)
        alert('¡Ubicación enviada! El dueño recibió un correo con la ubicación de su mascota.')
      } else {
        // Mostrar mensaje más específico si es un error de Resend
        if (emailResult.error === 'Límite del plan gratuito de Resend') {
          alert('Error: El plan gratuito de Resend solo permite enviar emails a tu propia dirección. Por favor, usa WhatsApp para enviar la ubicación o verifica un dominio en Resend.')
        } else {
          alert('Error al enviar el correo. Por favor, intenta nuevamente o usa WhatsApp.')
        }
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
      const currentLocation = locationRef.current || await getLocation()

      if (!currentLocation) {
        alert('No se pudo obtener tu ubicación. Por favor, permite el acceso y vuelve a intentar.')
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
      const customIntro = ownerData.customMessage
        ? `${ownerData.customMessage.trim()} `
        : `Hola, encontré a tu mascota ${ownerData.petName}. `
      let whatsappMessage = customIntro
      
      if (currentLocation.address) {
        whatsappMessage += `Ubicación: ${currentLocation.address} `
      }
      whatsappMessage += `(Coordenadas: ${currentLocation.latitude}, ${currentLocation.longitude})`

      const whatsappUrl = `https://wa.me/${ownerData.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
      
      // Registrar el escaneo
      const scanLogData = {
        qr_code_id: qrData.id,
        pet_id: petId,
        contact_method: 'whatsapp',
        message_sent: true,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        location_address: currentLocation.address || null,
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
    
    const whatsappMessage = ownerData.customMessage
      ? ownerData.customMessage.trim()
      : `Hola, encontré a tu mascota ${ownerData.petName}.`
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

  const ageLabel =
    ownerData?.age !== null && ownerData?.age !== undefined
      ? `${ownerData.age} ${ownerData.age === 1 ? 'año' : 'años'}`
      : null
  const showBreed = Boolean(ownerData?.breed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4646FA] via-[#4F4FFB] to-[#3535E8] px-4 py-12">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between text-white/80">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium rounded-full border border-white/30 px-4 py-2 hover:bg-white/10 transition-colors"
          >
            <FaArrowLeft className="text-xs" />
            Volver al inicio
          </Link>
          <div className="text-xs sm:text-sm">
            Código: <span className="font-semibold text-white">{qrCode}</span>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
        {!submitted ? (
          <>
            <div className="bg-gradient-to-r from-[#4646FA] to-[#3535E8] px-6 py-8 text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-32 rounded-2xl border border-white/40 shadow-xl overflow-hidden">
                  {ownerData?.petPhoto ? (
                    <Image
                      src={ownerData.petPhoto}
                      alt={ownerData.petName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-white/15 backdrop-blur flex items-center justify-center">
                      <FaPaw className="text-4xl text-white/80" />
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left flex-1">
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">
                    Mascota identificada
                  </p>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                    {ownerData?.petName}
                  </h1>
                  {(showBreed || ageLabel) && (
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                      {showBreed && (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-sm">
                          <FaPaw className="text-white/80" />
                          {ownerData?.breed}
                        </span>
                      )}
                      {ageLabel && (
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-sm">
                          <FaCheckCircle className="text-white/80" />
                          {ageLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {ownerData?.customMessage && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <FaInfoCircle className="text-[#4646FA]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#4646FA] uppercase tracking-wide mb-1">
                        Mensaje del dueño
                      </p>
                      <p className="text-sm text-[#2F2F98] leading-relaxed">
                        {ownerData.customMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {gettingLocation && (
                  <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm">
                    <FaLocationArrow className="text-[#4646FA] text-xl mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-[#4646FA]">
                        Obteniendo tu ubicación...
                      </p>
                      <p className="text-xs text-[#2F2F98]">
                        Esto nos permite compartir tu posición con el dueño para facilitar la entrega.
                      </p>
                    </div>
                  </div>
                )}

                {location && (
                  <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/80 p-5 shadow-sm">
                    <FaCheckCircle className="text-green-600 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-green-700">
                        Ubicación lista para compartir
                      </p>
                      {location.address && (
                        <p className="text-xs text-green-700 mt-1">
                          {location.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {locationError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
                    <FaExclamationTriangle className="text-amber-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">
                        No pudimos obtener tu ubicación
                      </p>
                      <p className="text-xs text-amber-700/90 mt-1">
                        {locationError}
                      </p>
                    </div>
                  </div>
                )}

                {!location && !gettingLocation && (
                  <div className="rounded-2xl border border-[#4646FA]/20 bg-white shadow-sm p-5">
                    <p className="text-sm font-semibold text-[#1F1F5B] mb-3">
                      ¿Quieres compartir tu ubicación?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={getLocation}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#4646FA] text-white font-medium shadow-md hover:bg-[#3535E8] hover:-translate-y-0.5 transition-all"
                      >
                        <FaLocationArrow className="text-sm" />
                        Permitir acceso a mi ubicación
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-3">
                      Solo usaremos tu ubicación para compartirla con el dueño de la mascota y registrar el intento de contacto.
                    </p>
                  </div>
                )}
              </div>

              {ownerData?.vaccinePdf && (
                <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <button
                    onClick={() => setShowVaccinePdf((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#1F1F5B] hover:bg-blue-50/60 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FaFilePdf className="text-[#E11D48]" />
                      {showVaccinePdf ? 'Ocultar PDF de vacunas' : 'Ver PDF de vacunas'}
                    </span>
                    {showVaccinePdf ? (
                      <FaChevronUp className="text-[#4646FA]" />
                    ) : (
                      <FaChevronDown className="text-[#4646FA]" />
                    )}
                  </button>
                  {showVaccinePdf && (
                    <div className="px-5 pb-5">
                      <Link
                        href={ownerData.vaccinePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-[#4646FA] text-white rounded-xl font-semibold shadow-md hover:bg-[#3535E8] hover:-translate-y-0.5 transition-all"
                      >
                        <FaFilePdf className="text-lg" />
                        Abrir PDF
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {ownerData?.email && (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow">
                      <FaEnvelope className="text-[#4646FA]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-[#1F1F5B]">Correo</p>
                      <p className="text-zinc-600 break-words">{ownerData.email}</p>
                    </div>
                  </div>
                )}
                {ownerData?.phone && (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow">
                      <FaPhoneAlt className="text-[#22C55E]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-[#1F1F5B]">WhatsApp</p>
                      <p className="text-zinc-600">{ownerData.phone}</p>
                    </div>
                  </div>
                )}
                {ownerData?.address && (
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:col-span-2">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow">
                      <FaMapMarkerAlt className="text-[#EF4444]" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-[#1F1F5B]">Dirección</p>
                      <p className="text-zinc-600">{ownerData.address}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {ownerData?.phone ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleSendLocationByWhatsApp}
                      disabled={sendingLocation || gettingLocation}
                      className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-green-500 text-white font-semibold shadow-md hover:bg-green-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaWhatsapp className="text-lg" />
                      Enviar ubicación por WhatsApp
                    </button>
                    <button
                      onClick={handleWriteWhatsApp}
                      disabled={sendingLocation}
                      className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl border-2 border-green-500 text-green-600 font-semibold hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="text-sm" />
                      Escribir por WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                    <FaExclamationTriangle className="text-amber-500 text-xl mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">
                        El dueño no agregó número de teléfono
                      </p>
                      <p className="text-xs text-amber-700/90 mt-1">
                        Pídele que complete su perfil para habilitar el contacto por WhatsApp.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 shadow-lg">
              <FaCheckCircle className="text-3xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1F1F5B] mb-2">¡Gracias por avisar!</h2>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                El dueño ya recibió tu mensaje. Mantente atento a su respuesta y gracias por ayudar a reunir a esta mascota con su familia.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#4646FA] text-white font-semibold shadow-md hover:bg-[#3535E8] transition-all"
            >
              <FaArrowLeft className="text-sm" />
              Volver al inicio
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

