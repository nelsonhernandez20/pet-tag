'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
        })
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Verificar si el perfil existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        // Actualizar perfil existente
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name || null,
            phone: profile.phone || null,
            address: profile.address || null,
          })
          .eq('id', user.id)

        if (updateError) throw updateError
      } else {
        // Crear perfil si no existe
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || null,
            phone: profile.phone || null,
            address: profile.address || null,
          })

        if (insertError) throw insertError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setProfile((prev) => ({
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

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      <nav className="bg-white shadow-sm border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-[#4646FA] hover:text-[#4646FA] font-medium transition-colors duration-200">
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold">Mi Perfil</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-sm text-zinc-600 mb-6">
            Completa tu perfil con tu información de contacto. Esta información será compartida 
            cuando alguien encuentre a tu mascota, según tu configuración de privacidad.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Perfil actualizado exitosamente
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-zinc-100 text-zinc-500"
              />
              <p className="text-xs text-zinc-600 mt-1">
                El correo electrónico no puede ser modificado.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Este teléfono será usado para contacto por WhatsApp.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dirección
              </label>
              <textarea
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows="3"
                placeholder="Calle, número, ciudad, estado, código postal"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
              <p className="text-xs text-zinc-600 mt-1">
                Esta dirección será compartida cuando alguien encuentre a tu mascota (si lo permites en la configuración de privacidad).
              </p>
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100 text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#4646FA] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-300 shadow-md font-medium"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}


