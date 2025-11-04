'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugQRPage() {
  const [qrCode, setQrCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const checkQR = async () => {
    setLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_code', qrCode)
        .maybeSingle()

      if (error) {
        setResult({
          error: true,
          message: error.message,
          code: error.code,
        })
        return
      }

      if (!data) {
        setResult({
          found: false,
          message: 'QR no encontrado en la base de datos',
        })
        return
      }

      setResult({
        found: true,
        data: data,
      })
    } catch (err) {
      setResult({
        error: true,
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const listRecentQRs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setResult({
        recent: true,
        data: data,
      })
    } catch (err) {
      setResult({
        error: true,
        message: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug QR Codes</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Buscar QR por código:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Ej: QR1234567890ABC"
                className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#4646FA] focus:border-[#4646FA] bg-white text-gray-800"
              />
              <button
                onClick={checkQR}
                disabled={loading || !qrCode}
                className="px-4 py-2 bg-[#4646FA] text-white rounded-lg hover:bg-[#4646FA] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-300 shadow-md font-medium"
              >
                Buscar
              </button>
            </div>
          </div>

          <button
            onClick={listRecentQRs}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            Ver últimos 10 QRs generados
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resultado:</h2>

            {result.error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p><strong>Error:</strong> {result.message}</p>
                {result.code && <p><strong>Código:</strong> {result.code}</p>}
              </div>
            )}

            {result.found === false && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p>{result.message}</p>
              </div>
            )}

            {result.found === true && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <p className="font-semibold mb-2">✅ QR encontrado:</p>
                <pre className="text-xs bg-white p-4 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}

            {result.recent && (
              <div>
                <p className="font-semibold mb-2">Últimos QRs generados:</p>
                {result.data && result.data.length > 0 ? (
                  <div className="space-y-2">
                    {result.data.map((qr) => (
                      <div key={qr.id} className="bg-zinc-100 p-3 rounded">
                        <p className="font-mono text-sm">{qr.qr_code}</p>
                        <p className="text-xs text-zinc-600">
                          {new Date(qr.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs">
                          Asociado: {qr.is_associated ? 'Sí' : 'No'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600">No hay QRs en la base de datos</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


