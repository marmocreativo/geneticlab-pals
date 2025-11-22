import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface Institucion {
  id: string
  nombre: string
  direccion: string
  latitud: number
  longitud: number
  sector_id: string | null
  google_place_id: string | null
  created_at: string
}

export function useInstituciones() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstituciones = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .order('nombre')

      if (error) throw error
      setInstituciones(data || [])
    } catch (err) {
      console.error('Error fetching instituciones:', err)
      toast.error('Error al cargar instituciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstituciones()
  }, [])

  return {
    instituciones,
    loading,
    fetchInstituciones
  }
}