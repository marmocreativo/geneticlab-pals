// hooks/useActividades.ts
import { useState, useCallback } from 'react'
import { actividadesService } from '@/services/actividadesService'
import { logError, parseError } from '@/lib/errorHandler'
import type { Actividad, ActividadInsert, ActividadUpdate } from '@/types/actividad'
import { toast } from 'sonner'

export function useActividades() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAllActividades = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await actividadesService.getAllActividades()
      setActividades(data)
    } catch (err) {
      console.error('Error fetching all actividades:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.fetchAllActividades', err)
      setError(errorMessage)
      toast.error('Error al cargar las actividades')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActividadesByInstitucion = useCallback(async (institucionId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await actividadesService.getActividadesByInstitucion(institucionId)
      setActividades(data)
    } catch (err) {
      console.error('Error fetching actividades por institucion:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.fetchActividadesByInstitucion', err)
      setError(errorMessage)
      toast.error('Error al cargar las actividades por institución')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActividadesByFecha = useCallback(async (fecha: string, palId?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await actividadesService.getActividadesByFecha(fecha, palId)
      setActividades(data)
    } catch (err) {
      console.error('Error fetching actividades por fecha:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.fetchActividadesByFecha', err)
      setError(errorMessage)
      toast.error('Error al cargar las actividades por fecha')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActividadesByPal = useCallback(async (palId: string, fechaInicio?: string, fechaFin?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await actividadesService.getActividadesByPal(palId, fechaInicio, fechaFin)
      setActividades(data)
    } catch (err) {
      console.error('Error fetching actividades por PAL:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.fetchActividadesByPal', err)
      setError(errorMessage)
      toast.error('Error al cargar las actividades por pal')
    } finally {
      setLoading(false)
    }
  }, [])

  const createActividad = useCallback(async (actividadData: ActividadInsert) => {
    try {
      const newActividad = await actividadesService.createActividad(actividadData)
      setActividades(prev => [newActividad, ...prev])
      toast.success('Actividad registrada exitosamente')
      return newActividad
    } catch (err) {
      console.error('Error creating actividad:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.createActividad', err)
      toast.error(`Error al crear la actividad: ${errorMessage}`)
      throw err
    }
  }, [])

  const updateActividad = useCallback(async (id: string, updates: ActividadUpdate) => {
    try {
      const updatedActividad = await actividadesService.updateActividad(id, updates)
      setActividades(prev => prev.map(actividad => 
        actividad.id === id ? updatedActividad : actividad
      ))
      toast.success('Actividad actualizada exitosamente')
      return updatedActividad
    } catch (err) {
      console.error('Error updating actividad:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.updateActividad', err)
      toast.error(`Error al actualizar la actividad: ${errorMessage}`)
      throw err
    }
  }, [])

  const deleteActividad = useCallback(async (id: string) => {
    try {
      await actividadesService.deleteActividad(id)
      setActividades(prev => prev.filter(actividad => actividad.id !== id))
      toast.success('Actividad eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting actividad:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.deleteActividad', err)
      toast.error(`Error al borrar la actividad: ${errorMessage}`)
      throw err
    }
  }, [])

  const getActividadById = useCallback(async (id: string) => {
    try {
      const actividad = await actividadesService.getActividadById(id)
      return actividad
    } catch (err) {
      console.error('Error fetching actividad by id:', err)
      const errorMessage = parseError(err)
      await logError('useActividades.getActividadById', err)
      toast.error(`Error al obtener la actividad: ${errorMessage}`)
      throw err
    }
  }, [])

  const getEstadisticasActividades = useCallback(async (palId?: string, fechaInicio?: string, fechaFin?: string) => {
    try {
      const stats = await actividadesService.getEstadisticasActividades(palId, fechaInicio, fechaFin)
      return stats
    } catch (err) {
      console.error('Error getting actividades stats:', err)
      throw err
    }
  }, [])

  const resetActividades = useCallback(() => {
    setActividades([])
    setError(null)
  }, [])

  return {
    actividades,
    loading,
    error,
    // Funciones principales
    fetchAllActividades,
    fetchActividadesByInstitucion,
    fetchActividadesByFecha,
    fetchActividadesByPal,
    createActividad,
    updateActividad,
    deleteActividad,
    getActividadById,
    getEstadisticasActividades,
    resetActividades,
    // Funciones de utilidad del servicio
    formatearNombreContacto: actividadesService.formatearNombreContacto,
    getTipoContactoLabel: actividadesService.getTipoContactoLabel,
    formatearFechaHora: actividadesService.formatearFechaHora,
    getTipoActividadLabel: actividadesService.getTipoActividadLabel, // NUEVO
     formatearFechaHoraConTipo: actividadesService.formatearFechaHoraConTipo // NUEVO
  }
}