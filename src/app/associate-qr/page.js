'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function AssociateQRContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCode = searchParams?.get('code')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pets, setPets] = useState([])
  const [selectedPetId, setSelectedPetId] = useState('')
  const [createNewPet, setCreateNewPet] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [associating, setAssociating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && qrCode) {
      fetchQRData()
      fetchPets()
    }
  }, [user, qrCode])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirect=/associate-qr${qrCode ? `?code=${qrCode}` : ''}`)
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchQRData = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_code', qrCode)
        .single()

      if (error) throw error

      if (!data) {
        setError('Código QR no encontrado')
        return
      }

      // Verificar si el QR está realmente asociado a una mascota activa
      if (data.is_associated) {
        // Buscar si existe una mascota con este QR code
        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('id')
          .eq('qr_code_id', data.id)
          .single()

        // Si no hay mascota asociada, significa que fue eliminada
        // Permitir reasociar el QR
        if (petError || !petData) {
          // El QR está marcado como asociado pero no tiene mascota activa
          // Permitir reasociarlo actualizando su estado
          const { error: updateError } = await supabase
            .from('qr_codes')
            .update({
              is_associated: false,
              user_id: null,
              associated_at: null
            })
            .eq('id', data.id)

          if (updateError) {
            console.warn('Error al liberar QR huérfano:', updateError)
          }

          // Continuar con el proceso de asociación
          setQrData({ ...data, is_associated: false })
          return
        }

        // Si hay mascota asociada, el QR realmente está en uso
        setError('Este código QR ya está asociado a una mascota activa')
        return
      }

      setQrData(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchPets = async () => {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .is('qr_code_id', null) // Solo mostrar mascotas sin QR asignado
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pets:', error)
      return
    }

    setPets(data || [])
  }

  const handleAssociate = async () => {
    if (!selectedPetId && !createNewPet) {
      setError('Por favor selecciona una mascota o crea una nueva')
      return
    }

    setAssociating(true)
    setError('')

    try {
      let petId = selectedPetId

      if (createNewPet) {
        // Primero crear la mascota SIN el qr_code_id para evitar dependencia circular
        const { data: newPet, error: petError } = await supabase
          .from('pets')
          .insert({
            user_id: user.id,
            name: 'Nueva Mascota', // Valor temporal
            // NO incluir qr_code_id aquí todavía
          })
          .select()
          .single()

        if (petError) throw petError
        petId = newPet.id

        // Ahora actualizar la mascota con el qr_code_id
        const { error: updatePetError } = await supabase
          .from('pets')
          .update({ qr_code_id: qrData.id })
          .eq('id', petId)

        if (updatePetError) throw updatePetError

        // Crear configuración de privacidad por defecto (solo si no existe)
        // Usar upsert para evitar duplicados
        await supabase
          .from('privacy_settings')
          .upsert({
            pet_id: petId,
            show_address: true,
            show_phone: true,
            show_email: true,
            show_name: true,
          }, {
            onConflict: 'pet_id'
          })
      } else {
        // Asociar QR a mascota existente
        const { error: updateError } = await supabase
          .from('pets')
          .update({ qr_code_id: qrData.id })
          .eq('id', petId)

        if (updateError) throw updateError
      }

      // Finalmente, actualizar el QR code como asociado
      // Nota: No necesitamos pet_id aquí porque la relación está en pets.qr_code_id
      const { error: qrUpdateError } = await supabase
        .from('qr_codes')
        .update({
          is_associated: true,
          user_id: user.id,
          associated_at: new Date().toISOString(),
        })
        .eq('id', qrData.id)

      if (qrUpdateError) throw qrUpdateError

      setSelectedPetId(petId)
      setSuccess(true)
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        router.push(createNewPet ? `/dashboard/pet/${petId}/edit` : '/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setAssociating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4">
        <div className="text-center">
          <div className="text-green-600 mb-4 text-6xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold mb-4">
            ¡QR Asociado Exitosamente!
          </h1>
          <p className="text-zinc-600 mb-6">
            {createNewPet 
              ? 'Ahora puedes completar la información de tu mascota.'
              : 'El código QR ha sido asociado a tu mascota.'}
          </p>
          <Link
            href={createNewPet ? `/dashboard/pet/${selectedPetId}/edit` : '/dashboard'}
            className="px-6 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#4646FA] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium inline-block"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Asociar Código QR
        </h1>

        {qrCode && (
          <div className="mb-6 text-center">
            <p className="text-sm text-zinc-600 mb-2">
              Código QR:
            </p>
            <code className="bg-zinc-100 px-3 py-1 rounded text-sm font-mono">
              {qrCode}
            </code>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!qrData ? (
          <div className="text-center">
            <p className="text-zinc-600 mb-6">
              {error || 'Cargando información del QR...'}
            </p>
            <Link href="/" className="text-[#4646FA] hover:text-[#4646FA] font-medium transition-colors duration-200">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Selecciona una mascota existente o crea una nueva
              </label>
              
              <div className="space-y-3">
                {pets.length > 0 && (
                  <>
                    {pets.map((pet) => (
                      <label
                        key={pet.id}
                        className="flex items-center p-3 border border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50"
                      >
                        <input
                          type="radio"
                          name="pet"
                          value={pet.id}
                          checked={selectedPetId === pet.id && !createNewPet}
                          onChange={(e) => {
                            setSelectedPetId(e.target.value)
                            setCreateNewPet(false)
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{pet.name}</div>
                          {pet.breed && (
                            <div className="text-sm text-zinc-600">
                              {pet.breed}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </>
                )}

                <label className="flex items-center p-3 border border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-50">
                  <input
                    type="radio"
                    name="pet"
                    checked={createNewPet}
                    onChange={() => {
                      setCreateNewPet(true)
                      setSelectedPetId('')
                    }}
                    className="mr-3"
                  />
                  <div className="font-medium">
                    Crear nueva mascota
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleAssociate}
              disabled={associating || (!selectedPetId && !createNewPet)}
              className="w-full px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {associating ? 'Asociando...' : 'Asociar QR'}
            </button>

            <Link
              href="/dashboard"
              className="block text-center text-zinc-600 hover:underline text-sm"
            >
              Cancelar y volver al dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AssociateQRPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="text-xl">Cargando...</div>
      </div>
    }>
      <AssociateQRContent />
    </Suspense>
  )
}

