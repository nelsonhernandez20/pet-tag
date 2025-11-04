'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { FaCamera, FaFolder, FaTimes, FaCheck } from 'react-icons/fa'

export default function EditPetPage() {
  const params = useParams()
  const router = useRouter()
  const petId = params?.id
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [age, setAge] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [vaccineFile, setVaccineFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && petId) {
      fetchPet()
    }
  }, [user, petId])

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Usar cámara trasera en móviles
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message)
      console.error('Error accessing camera:', err)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })
          setPhotoFile(file)
          setPhotoPreview(URL.createObjectURL(blob))
          stopCamera()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchPet = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      setName(data.name)
      setBreed(data.breed || '')
      setAge(data.age || '')
      setPhotoPreview(data.photo_url || null)
    } catch (err) {
      setError(err.message)
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
      let vaccinePdfUrl = null
      let photoUrl = null

      // Obtener URLs actuales si existen
      const { data: currentPet } = await supabase
        .from('pets')
        .select('vaccine_pdf_url, photo_url')
        .eq('id', petId)
        .single()

      vaccinePdfUrl = currentPet?.vaccine_pdf_url || null
      photoUrl = currentPet?.photo_url || null

      // Subir foto si hay archivo nuevo
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${user.id}/photos/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(fileName, photoFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(fileName)

        photoUrl = publicUrl
      }

      // Subir PDF si hay archivo nuevo
      if (vaccineFile) {
        const fileExt = vaccineFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('vaccine-pdfs')
          .upload(fileName, vaccineFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('vaccine-pdfs')
          .getPublicUrl(fileName)

        vaccinePdfUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from('pets')
        .update({
          name,
          breed: breed || null,
          age: age ? parseInt(age) : null,
          photo_url: photoUrl,
          vaccine_pdf_url: vaccinePdfUrl,
        })
        .eq('id', petId)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3]">
        <div className="text-xl text-gray-800">Cargando...</div>
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
              <h1 className="text-2xl font-bold">Editar Mascota</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            Mascota actualizada exitosamente. Redirigiendo...
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                Foto de la Mascota
              </label>
              {photoPreview && (
                <div className="mb-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-zinc-300"
                  />
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <label className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 text-gray-700 font-medium">
                  <FaFolder />
                  Subir Foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setPhotoFile(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setPhotoPreview(reader.result)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center flex items-center justify-center gap-2 text-gray-700 font-medium"
                >
                  <FaCamera />
                  Tomar Foto
                </button>
              </div>
              {showCamera && (
                <div className="mb-4 p-4 bg-[#F3F3F3] rounded-lg">
                  <video ref={videoRef} autoPlay playsInline className="w-full max-w-md mb-2 rounded" />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium flex items-center justify-center gap-2"
                    >
                      <FaCheck />
                      Capturar
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                    >
                      <FaTimes />
                      Cancelar
                    </button>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Formatos: JPG, PNG, WEBP. Tamaño recomendado: máximo 5MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                Nombre de la Mascota *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                Raza
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                Edad
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-800">
                PDF de Control de Vacunas
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setVaccineFile(e.target.files[0])}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
              <p className="text-sm text-gray-600 mt-2">
                Deja vacío si no deseas cambiar el PDF actual.
              </p>
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center flex items-center justify-center gap-2 text-gray-700 font-medium"
              >
                <FaTimes />
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-300 shadow-md font-medium flex items-center justify-center gap-2"
              >
                <FaCheck />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}


