'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getQRBaseUrl } from '@/lib/config'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { FaEdit, FaTrash, FaShieldAlt, FaQrcode, FaCamera, FaFolder, FaTimes, FaCheck, FaPlus } from 'react-icons/fa'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPet, setShowAddPet] = useState(false)
  const [selectedPet, setSelectedPet] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPets()
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

  const fetchPets = async () => {
    // Buscar mascotas con sus relaciones
    const { data, error } = await supabase
      .from('pets')
      .select(`
        *,
        privacy_settings (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pets:', error)
      return
    }

    // Ahora buscar los QR codes para cada mascota
    const petsWithQRs = await Promise.all(
      (data || []).map(async (pet) => {
        if (pet.qr_code_id) {
          const { data: qrData } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', pet.qr_code_id)
            .single()
          
          return {
            ...pet,
            qr_codes: qrData ? [qrData] : []
          }
        }
        return {
          ...pet,
          qr_codes: []
        }
      })
    )

    setPets(petsWithQRs)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAddPet = () => {
    setSelectedPet(null)
    setShowAddPet(true)
  }

  const handleEditPet = (pet) => {
    setSelectedPet(pet)
    setShowAddPet(true)
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
      <nav className="bg-[#4646FA] shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 sm:py-0 sm:h-16">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Mi Dashboard</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/dashboard/profile"
                className="text-sm text-white hover:underline w-full sm:w-auto text-center sm:text-left"
              >
                Mi Perfil
              </Link>
              <span className="text-xs sm:text-sm text-white/90 truncate max-w-[200px] sm:max-w-none">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium text-sm sm:text-base"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Mis Mascotas</h2>
          <button
            onClick={handleAddPet}
            className="w-full sm:w-auto px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaPlus className="text-sm" />
            Agregar Mascota
          </button>
        </div>

        {showAddPet && (
          <AddPetModal
            pet={selectedPet}
            user={user}
            onClose={() => {
              setShowAddPet(false)
              setSelectedPet(null)
            }}
            onSuccess={() => {
              setShowAddPet(false)
              setSelectedPet(null)
              fetchPets()
            }}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={handleEditPet}
              onUpdate={fetchPets}
            />
          ))}
        </div>

        {pets.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg mb-4">No tienes mascotas registradas</p>
            <button
              onClick={handleAddPet}
              className="px-6 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium"
            >
              Agregar tu primera mascota
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function PetCard({ pet, onEdit, onUpdate }) {
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)

  const qrCode = pet.qr_codes?.[0]
  const privacySettings = pet.privacy_settings?.[0]

  const handleDelete = async () => {
    const message = pet.qr_code_id 
      ? '¿Estás seguro de que deseas eliminar esta mascota? Esto también eliminará la foto y el PDF de vacunas asociados. El código QR quedará disponible para asociarlo a otra mascota.'
      : '¿Estás seguro de que deseas eliminar esta mascota? Esto también eliminará la foto y el PDF de vacunas asociados.'
    
    if (!confirm(message)) {
      return
    }

    try {
      // Eliminar foto del storage si existe
      if (pet.photo_url) {
        try {
          // Extraer el path del archivo de la URL
          // URL formato: https://[project].supabase.co/storage/v1/object/public/pet-photos/[user-id]/photos/[filename]
          // Path necesario para remove: [user-id]/photos/[filename]
          const urlParts = pet.photo_url.split('/')
          const bucketIndex = urlParts.indexOf('pet-photos')
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            // Obtener todo después del bucket name
            const filePath = urlParts.slice(bucketIndex + 1).join('/')
            
            const { error: deletePhotoError } = await supabase.storage
              .from('pet-photos')
              .remove([filePath])

            if (deletePhotoError) {
              console.warn('Error al eliminar foto del storage:', deletePhotoError)
              // Continuar aunque falle la eliminación de la foto
            }
          }
        } catch (err) {
          console.warn('Error al procesar eliminación de foto:', err)
        }
      }

      // Eliminar PDF de vacunas del storage si existe
      if (pet.vaccine_pdf_url) {
        try {
          // URL formato: https://[project].supabase.co/storage/v1/object/public/vaccine-pdfs/[user-id]/[filename]
          // Path necesario para remove: [user-id]/[filename]
          const urlParts = pet.vaccine_pdf_url.split('/')
          const bucketIndex = urlParts.indexOf('vaccine-pdfs')
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            // Obtener todo después del bucket name
            const filePath = urlParts.slice(bucketIndex + 1).join('/')
            
            const { error: deletePdfError } = await supabase.storage
              .from('vaccine-pdfs')
              .remove([filePath])

            if (deletePdfError) {
              console.warn('Error al eliminar PDF del storage:', deletePdfError)
              // Continuar aunque falle la eliminación del PDF
            }
          }
        } catch (err) {
          console.warn('Error al procesar eliminación de PDF:', err)
        }
      }

      // Si la mascota tiene un QR asociado, liberarlo para que pueda reutilizarse
      if (pet.qr_code_id) {
        try {
          // Actualizar el QR code para marcarlo como disponible nuevamente
          const { error: qrUpdateError } = await supabase
            .from('qr_codes')
            .update({
              is_associated: false,
              user_id: null,
              associated_at: null
            })
            .eq('id', pet.qr_code_id)

          if (qrUpdateError) {
            console.warn('Error al liberar QR code:', qrUpdateError)
            // Continuar aunque falle la actualización del QR
          }
        } catch (err) {
          console.warn('Error al procesar liberación de QR:', err)
        }
      }

      // Eliminar la mascota (esto también eliminará privacy_settings por CASCADE)
      // El qr_code_id se pondrá en NULL automáticamente por ON DELETE SET NULL
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', pet.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      alert('Error al eliminar mascota: ' + error.message)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-4 mb-4">
        <div className="flex gap-3 sm:gap-4 flex-1 w-full">
          {pet.photo_url && (
            <div className="shrink-0">
              <img
                src={pet.photo_url}
                alt={pet.name}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-zinc-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold mb-1 text-gray-800 truncate">{pet.name}</h3>
            {pet.breed && <p className="text-xs sm:text-sm text-gray-600 truncate">{pet.breed}</p>}
            {pet.age && <p className="text-xs sm:text-sm text-gray-600">{pet.age} años</p>}
          </div>
        </div>
        <button
          onClick={() => onEdit(pet)}
          className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] transition-colors duration-200 flex items-center justify-center gap-1.5"
        >
          <FaEdit className="text-xs" />
          Editar
        </button>
      </div>

      {qrCode && (
        <div className="mt-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full px-3 sm:px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <FaQrcode className="text-sm" />
            {showQR ? 'Ocultar' : 'Ver'} Código QR
          </button>
          {showQR && (
            <div className="mt-4 flex justify-center">
              <div className="bg-white p-2 sm:p-4 rounded">
                <div className="sm:hidden">
                  <QRCodeSVG
                    value={`${getQRBaseUrl()}/qr/${qrCode.qr_code}`}
                    size={160}
                  />
                </div>
                <div className="hidden sm:block">
                  <QRCodeSVG
                    value={`${getQRBaseUrl()}/qr/${qrCode.qr_code}`}
                    size={200}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {pet.vaccine_pdf_url && (
        <div className="mt-4">
          <a
            href={pet.vaccine_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200 block text-center sm:text-left"
          >
            Ver PDF de Vacunas
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
        <Link
          href={`/dashboard/pet/${pet.id}/settings`}
          className="text-xs sm:text-sm text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200 flex items-center justify-center sm:justify-start gap-1.5 py-2 sm:py-0"
        >
          <FaShieldAlt className="text-xs" />
          Configurar Privacidad
        </Link>
        <button
          onClick={handleDelete}
          className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-200 flex items-center justify-center sm:justify-start gap-1.5 py-2 sm:py-0"
        >
          <FaTrash className="text-xs" />
          Eliminar
        </button>
      </div>
    </div>
  )
}

function AddPetModal({ pet, user, onClose, onSuccess }) {
  const removeFileFromStorage = async (bucketName, fileUrl) => {
    if (!fileUrl) return
    try {
      const urlParts = fileUrl.split('/')
      const bucketIndex = urlParts.indexOf(bucketName)
      if (bucketIndex === -1 || bucketIndex >= urlParts.length - 1) return
      const filePath = urlParts.slice(bucketIndex + 1).join('/')
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath])
      if (deleteError) {
        console.warn(`Error al eliminar archivo de ${bucketName}:`, deleteError)
      }
    } catch (err) {
      console.warn(`Error al procesar eliminación en ${bucketName}:`, err)
    }
  }
  const [name, setName] = useState(pet?.name || '')
  const [breed, setBreed] = useState(pet?.breed || '')
  const [age, setAge] = useState(pet?.age || '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(pet?.photo_url || null)
  const [vaccineFile, setVaccineFile] = useState(null)
  const [vaccineUrl, setVaccineUrl] = useState(pet?.vaccine_pdf_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

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
      setShowCamera(true)
    } catch (err) {
      alert('Error al acceder a la cámara: ' + err.message)
      console.error('Error accessing camera:', err)
    }
  }

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      const playPromise = videoRef.current.play?.()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {})
      }
    }
  }, [showCamera])

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
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let vaccinePdfUrl = vaccineUrl || null
      let photoUrl = pet?.photo_url || null

      // Subir foto si hay archivo
      if (photoFile) {
        if (photoUrl) {
          await removeFileFromStorage('pet-photos', photoUrl)
        }
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

      // Subir PDF si hay archivo
      if (vaccineFile) {
        if (vaccinePdfUrl) {
          await removeFileFromStorage('vaccine-pdfs', vaccinePdfUrl)
        }
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
        setVaccineUrl(publicUrl)
      }

      if (pet) {
        // Actualizar mascota existente
        const { error: updateError } = await supabase
          .from('pets')
          .update({
            name,
            breed: breed || null,
            age: age ? parseInt(age) : null,
            photo_url: photoUrl,
            vaccine_pdf_url: vaccinePdfUrl,
          })
          .eq('id', pet.id)

        if (updateError) throw updateError
      } else {
        // Crear nueva mascota
        const { data: petData, error: insertError } = await supabase
          .from('pets')
          .insert({
            user_id: user.id,
            name,
            breed: breed || null,
            age: age ? parseInt(age) : null,
            photo_url: photoUrl,
            vaccine_pdf_url: vaccinePdfUrl,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Crear configuración de privacidad por defecto (usar upsert para evitar duplicados)
        await supabase
          .from('privacy_settings')
          .upsert({
            pet_id: petData.id,
            show_address: true,
            show_phone: true,
            show_email: true,
            show_name: true,
          }, {
            onConflict: 'pet_id'
          })
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#F3F3F3] bg-opacity-95 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 border border-slate-200 my-4">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">
          {pet ? 'Editar Mascota' : 'Agregar Mascota'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <label className="flex-1 px-3 sm:px-4 py-2 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center cursor-pointer flex items-center justify-center gap-2 text-gray-700 font-medium text-sm sm:text-base">
                <FaFolder className="text-sm" />
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
                className="flex-1 px-3 sm:px-4 py-2 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center flex items-center justify-center gap-2 text-gray-700 font-medium text-sm sm:text-base"
              >
                <FaCamera className="text-sm" />
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
                    className="flex-1 px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] flex items-center justify-center gap-2"
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
          {vaccineUrl && (
            <div className="mb-2 text-sm">
              <a
                href={vaccineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200"
              >
                Ver PDF actual
              </a>
            </div>
          )}
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setVaccineFile(e.target.files[0])}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-zinc-300 rounded-lg hover:bg-[#F3F3F3] text-center flex items-center justify-center gap-2 text-gray-700 font-medium text-sm sm:text-base"
            >
              <FaTimes className="text-sm" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] disabled:opacity-50 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
            >
              <FaCheck className="text-sm" />
              {loading ? 'Guardando...' : pet ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

