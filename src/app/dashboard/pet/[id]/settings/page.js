'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const defaultPrivacySettings = {
  show_address: true,
  show_phone: true,
  show_email: true,
  show_name: true,
  custom_message: '',
}

const mapDbSettings = (dbSettings) => ({
  show_address: dbSettings?.show_address ?? true,
  show_phone: dbSettings?.show_phone ?? true,
  show_email: dbSettings?.show_email ?? true,
  show_name: dbSettings?.show_name ?? true,
  custom_message: dbSettings?.custom_message ?? '',
})

export default function PrivacySettingsPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params?.id
  const [user, setUser] = useState(null)
  const [pet, setPet] = useState(null)
  const [privacySettings, setPrivacySettings] = useState(defaultPrivacySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && petId) {
      fetchPetData()
    }
  }, [user, petId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchPetData = async () => {
    try {
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('*, privacy_settings(*)')
        .eq('id', petId)
        .eq('user_id', user.id)
        .single()

      if (petError) throw petError

      setPet(petData)
      const privacyRecord = Array.isArray(petData.privacy_settings)
        ? petData.privacy_settings[0]
        : petData.privacy_settings

      if (privacyRecord) {
        setPrivacySettings(mapDbSettings(privacyRecord))
      } else {
        // Crear configuración por defecto si no existe
        // Usar upsert para evitar duplicados si se intenta crear dos veces
        const { data: newSettings, error: settingsError } = await supabase
          .from('privacy_settings')
          .upsert({
            pet_id: petId,
            ...defaultPrivacySettings,
          }, {
            onConflict: 'pet_id'
          })
          .select()
          .single()

        if (settingsError) {
          // Si hay error, intentar buscar el registro existente
          const { data: existingSettings } = await supabase
            .from('privacy_settings')
            .select('*')
            .eq('pet_id', petId)
            .single()

          if (existingSettings) {
            setPrivacySettings(mapDbSettings(existingSettings))
          } else {
            throw settingsError
          }
        } else {
          setPrivacySettings(mapDbSettings(newSettings))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('privacy_settings')
        .update(privacySettings)
        .eq('pet_id', petId)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Mascota no encontrada</h1>
          <Link href="/dashboard" className="text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200">
            Volver al dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <nav className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200">
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold">Configuración de Privacidad</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-slate-200">
          <h2 className="text-xl font-semibold mb-2">{pet.name}</h2>
          <p className="text-sm text-zinc-600">
            Configura qué información quieres mostrar cuando alguien escanee el código QR de tu mascota.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Configuración guardada exitosamente
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 border border-slate-200">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información a Mostrar</h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-zinc-300 rounded-lg cursor-pointer hover:bg-[#F3F3F3] transition-colors duration-200">
                <div>
                  <div className="font-medium">Mostrar Nombre de la Mascota</div>
                  <div className="text-sm text-zinc-600">
                    El nombre de tu mascota aparecerá cuando alguien escanee el QR
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_name}
                  onChange={(e) => handleChange('show_name', e.target.checked)}
                  className="ml-4 w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-zinc-300 rounded-lg cursor-pointer hover:bg-[#F3F3F3] transition-colors duration-200">
                <div>
                  <div className="font-medium">Mostrar Correo Electrónico</div>
                  <div className="text-sm text-zinc-600">
                    Tu correo electrónico será compartido cuando alguien escanee el QR
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_email}
                  onChange={(e) => handleChange('show_email', e.target.checked)}
                  className="ml-4 w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-zinc-300 rounded-lg cursor-pointer hover:bg-[#F3F3F3] transition-colors duration-200">
                <div>
                  <div className="font-medium">Mostrar Teléfono</div>
                  <div className="text-sm text-zinc-600">
                    Tu número de teléfono estará disponible para contacto por WhatsApp
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_phone}
                  onChange={(e) => handleChange('show_phone', e.target.checked)}
                  className="ml-4 w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-zinc-300 rounded-lg cursor-pointer hover:bg-[#F3F3F3] transition-colors duration-200">
                <div>
                  <div className="font-medium">Mostrar Dirección</div>
                  <div className="text-sm text-zinc-600">
                    Tu dirección será compartida cuando alguien encuentre tu mascota
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_address}
                  onChange={(e) => handleChange('show_address', e.target.checked)}
                  className="ml-4 w-5 h-5"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mensaje Personalizado (opcional)
            </label>
            <textarea
              value={privacySettings.custom_message || ''}
              onChange={(e) => handleChange('custom_message', e.target.value)}
              rows="4"
              placeholder="Ejemplo: 'Por favor, contáctame si encuentras a mi mascota. Ofrezco recompensa.'"
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
            />
            <p className="text-sm text-zinc-600 mt-2">
              Este mensaje aparecerá cuando alguien escanee el código QR de tu mascota.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-300 shadow-md font-medium"
              translate="no"
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg hover:bg-zinc-100 text-center"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}


