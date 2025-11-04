'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getQRBaseUrl } from '@/lib/config'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

const ALLOWED_EMAIL = 'nelsonhernandez335@gmail.com'

export default function GenerateQRPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [qrCodes, setQrCodes] = useState([])
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push(`/auth/login?redirect=/generate-qr`)
      return
    }

    if (user.email !== ALLOWED_EMAIL) {
      setError('Acceso denegado. Solo usuarios autorizados pueden generar códigos QR.')
      setLoading(false)
      return
    }

    setUser(user)
    setLoading(false)
  }

  const generateQRCode = () => {
    return `QR${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase()
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    setQrCodes([])

    try {
      const newQRCodes = []
      
      for (let i = 0; i < quantity; i++) {
        const qrCode = generateQRCode()
        
        const { data, error: insertError } = await supabase
          .from('qr_codes')
          .insert({
            qr_code: qrCode,
            is_associated: false,
          })
          .select()
          .single()

        if (insertError) {
          // Si el código ya existe, generar uno nuevo
          if (insertError.code === '23505') {
            i-- // Reintentar este índice
            continue
          }
          throw insertError
        }

        newQRCodes.push({
          id: data.id,
          qr_code: qrCode,
          url: `${getQRBaseUrl()}/qr/${qrCode}`,
        })
      }

      setQrCodes(newQRCodes)
    } catch (err) {
      setError(err.message || 'Error al generar códigos QR')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = (qrCode, index, format = 'png', size = 1000) => {
    const svg = document.getElementById(`qr-svg-${index}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = size
      canvas.height = size
      ctx.drawImage(img, 0, 0, size, size)
      
      if (format === 'png') {
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `qr-${qrCode}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      } else if (format === 'svg') {
        // Descargar SVG directamente
        const blob = new Blob([svgData], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const downloadLink = document.createElement('a')
        downloadLink.download = `qr-${qrCode}.svg`
        downloadLink.href = url
        downloadLink.click()
        URL.revokeObjectURL(url)
      }
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleDownloadAll = () => {
    qrCodes.forEach((qr, index) => {
      setTimeout(() => {
        handleDownload(qr.qr_code, index, 'png', 2000)
      }, index * 500) // Descargar uno cada 500ms para no saturar el navegador
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Verificando acceso...</div>
      </div>
    )
  }

  if (!user || user.email !== ALLOWED_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F3F3] px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Acceso Denegado</h1>
          <p className="text-zinc-600 mb-6">
            {error || 'No tienes permisos para acceder a esta página. Solo usuarios autorizados pueden generar códigos QR.'}
          </p>
          <div className="space-y-4">
            <Link
              href="/"
              className="block px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 shadow-md font-medium"
            >
              Volver al inicio
            </Link>
            {user && (
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200">
              ← Volver al inicio
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Generar Códigos QR para Collares</h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-green-800">
              ✓ Acceso autorizado: Solo tú puedes generar códigos QR
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h2 className="font-semibold mb-2">📋 Proceso para Crear Collares:</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-700">
              <li><strong>Genera los códigos QR</strong> desde esta página (puedes generar múltiples a la vez)</li>
              <li><strong>Descarga los QRs</strong> en formato PNG (alta resolución) o SVG (vectorial)</li>
              <li><strong>Envía los archivos a tu imprenta/veterinaria</strong> para que los impriman en los collares</li>
              <li><strong>Los collares se venden</strong> en las veterinarias con los QRs ya impresos</li>
              <li><strong>Cuando un cliente compra un collar</strong>, escanea el QR y lo asocia a su cuenta</li>
            </ol>
          </div>
          
          <p className="text-zinc-600 mb-4">
            Los códigos QR se generan y guardan en la base de datos. Cada código es único y 
            puede asociarse a una cuenta cuando el cliente escanee el collar físico.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {qrCodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Cantidad de códigos QR a generar
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
              <p className="text-sm text-zinc-600 mt-2">
                Puedes generar entre 1 y 100 códigos QR a la vez. Ideal para producción de collares.
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full px-4 py-3 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 shadow-md"
            >
              {generating ? 'Generando...' : 'Generar Códigos QR'}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              ✓ {qrCodes.length} código(s) QR generado(s) exitosamente
            </div>

            <div className="mb-6 flex flex-wrap gap-4">
              {qrCodes.length > 1 && (
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Descargar Todos los QRs
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.map((qr, index) => (
                <div
                  key={qr.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="bg-white p-4 rounded border-2 border-zinc-200">
                      <QRCodeSVG
                        id={`qr-svg-${index}`}
                        value={qr.url}
                        size={250}
                        level="H" // Nivel de corrección de errores más alto
                      />
                    </div>
                  </div>
                  <div className="mb-4 text-center space-y-2">
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">
                        Código:
                      </p>
                      <code className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded block break-all">
                        {qr.qr_code}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-600 mb-1">
                        URL:
                      </p>
                      <p className="text-xs text-[#4646FA] break-all">
                        {qr.url}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleDownload(qr.qr_code, index, 'png', 2000)}
                      className="w-full px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#3535E8] hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium transition-all duration-300 shadow-md"
                    >
                      Descargar PNG (Alta Resolución)
                    </button>
                    <button
                      onClick={() => handleDownload(qr.qr_code, index, 'svg')}
                      className="w-full px-4 py-2 bg-zinc-200 rounded-lg hover:bg-zinc-300 text-sm font-medium"
                    >
                      Descargar SVG (Vectorial)
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-zinc-600 text-center">
                    <p>💡 PNG: Para impresión directa</p>
                    <p>💡 SVG: Para diseño profesional</p>
                  </div>
                  <div className="mt-2 text-center">
                    <Link
                      href={`/qr/${qr.qr_code}`}
                      target="_blank"
                      className="text-xs text-[#4646FA] hover:text-[#3535E8] font-medium transition-colors duration-200"
                    >
                      Ver página del QR
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setQrCodes([])
                  setQuantity(1)
                }}
                className="px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-100"
              >
                Generar más códigos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

