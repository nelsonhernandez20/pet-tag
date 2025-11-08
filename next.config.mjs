import { URL } from 'node:url'

const supabaseRemotePatterns = []

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl)
    if (hostname) {
      supabaseRemotePatterns.push({
        protocol: 'https',
        hostname,
        pathname: '/storage/v1/object/public/**',
      })
    }
  } catch (error) {
    console.warn('No se pudo analizar NEXT_PUBLIC_SUPABASE_URL:', error)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseRemotePatterns,
  },
}

export default nextConfig
