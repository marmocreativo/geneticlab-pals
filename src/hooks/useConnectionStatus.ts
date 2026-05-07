import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type ConnectionQuality = 'buena' | 'regular' | 'mala' | 'sin-red'
export type GPSStatus = 'disponible' | 'denegado' | 'no-soportado' | 'verificando'

export function useConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [quality, setQuality] = useState<ConnectionQuality>('buena')
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('verificando')

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => { setOnline(false); setQuality('sin-red') }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const nav = navigator as any
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection
    if (!conn) return

    const updateQuality = () => {
      if (!navigator.onLine) { setQuality('sin-red'); return }
      const { effectiveType, downlink } = conn
      if (effectiveType === '4g' && downlink > 1) setQuality('buena')
      else if (effectiveType === '3g' || downlink > 0.3) setQuality('regular')
      else setQuality('mala')
    }

    updateQuality()
    conn.addEventListener('change', updateQuality)
    return () => conn.removeEventListener('change', updateQuality)
  }, [online])

  useEffect(() => {
    const check = async () => {
      try {
        const { error } = await supabase.from('catalogos').select('id').limit(1)
        setSupabaseOk(!error)
      } catch {
        setSupabaseOk(false)
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [online])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('no-soportado')
      return
    }

    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') setGpsStatus('disponible')
      else if (result.state === 'denied') setGpsStatus('denegado')
      else setGpsStatus('verificando')

      result.addEventListener('change', () => {
        if (result.state === 'granted') setGpsStatus('disponible')
        else if (result.state === 'denied') setGpsStatus('denegado')
        else setGpsStatus('verificando')
      })
    })
  }, [])

  return { online, quality, supabaseOk, gpsStatus }
}