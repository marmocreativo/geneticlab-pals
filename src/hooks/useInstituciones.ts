import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logError, parseError } from '@/lib/errorHandler'
import { useAuth } from '@/contexts/AuthContext'
import type { Institucion } from '@/types/institucion'

export function useInstituciones() {
  const { user } = useAuth()
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
          contactos_count:contactos(count)
        `)
        .order('nombre')

      if (error) throw error

      // Conteo de visitas del PAL activo, por institución
      let visitasPorInstitucion: Record<string, number> = {}
      if (user?.id) {
        const { data: visitasData, error: visitasError } = await supabase
          .from('visitas')
          .select('institucion_id')
          .eq('pal_id', user.id)

        if (visitasError) throw visitasError

        visitasPorInstitucion = (visitasData ?? []).reduce((acc, v) => {
          acc[v.institucion_id] = (acc[v.institucion_id] ?? 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      const institucionesWithCounts = data?.map(institucion => ({
        ...institucion,
        contactos_count: institucion.contactos_count?.[0]?.count || 0,
        visitas_count: visitasPorInstitucion[institucion.id] || 0,
        sector_nombre: institucion.catalogos?.nombre || 'Sin sector'
      })) || []

      setInstituciones(institucionesWithCounts)
    } catch (err) {
      console.error('Error fetching instituciones:', err)
      const errorMessage = parseError(err)
      await logError('useInstituciones.fetchInstituciones', err)
      toast.error(`Error al cargar instituciones: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstituciones()
  }, [user?.id])

  return {
    instituciones,
    loading,
    fetchInstituciones
  }
}