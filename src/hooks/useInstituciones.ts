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
        .select(`
          *,
          catalogos!sector_id(nombre),
          contactos_count:contactos(count),
          visitas_count:visitas(count)
        `)
        .order('nombre')

      if (error) throw error
      
      // Procesar los datos para extraer los conteos
      const institucionesWithCounts = data?.map(institucion => ({
        ...institucion,
        contactos_count: institucion.contactos_count?.[0]?.count || 0,
        visitas_count: institucion.visitas_count?.[0]?.count || 0,
        sector_nombre: institucion.catalogos?.nombre || 'Sin sector'
      })) || []
      
      setInstituciones(institucionesWithCounts)
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