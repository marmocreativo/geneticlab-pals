import { useState, useEffect } from 'react'
import { actividadesService } from '@/services/actividadesService'
import type { Actividad, ActividadInsert, ActividadUpdate } from '@/types/actividad'
import { toast } from 'sonner'

export function useActividades() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActividadesByVisita = async (visitaId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await actividadesService.getActividadesByVisita(visitaId)
      setActividades(data)
    } catch (err) {
      console.error('Error fetching actividades:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las actividades')
    } finally {
      setLoading(false)
    }
  }

  const createActividad = async (actividadData: ActividadInsert) => {
    try {
      const newActividad = await actividadesService.createActividad(actividadData)
      setActividades(prev => [newActividad, ...prev])
      toast.success('Actividad registrada exitosamente')
      return newActividad
    } catch (err) {
      console.error('Error creating actividad:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al registrar la actividad: ${errorMessage}`)
      throw err
    }
  }

  const updateActividad = async (id: string, updates: ActividadUpdate) => {
    try {
      const updatedActividad = await actividadesService.updateActividad(id, updates)
      setActividades(prev => prev.map(actividad => 
        actividad.id === id ? updatedActividad : actividad
      ))
      toast.success('Actividad actualizada exitosamente')
      return updatedActividad
    } catch (err) {
      console.error('Error updating actividad:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al actualizar la actividad: ${errorMessage}`)
      throw err
    }
  }

  const deleteActividad = async (id: string) => {
    try {
      await actividadesService.deleteActividad(id)
      setActividades(prev => prev.filter(actividad => actividad.id !== id))
      toast.success('Actividad eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting actividad:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al eliminar la actividad: ${errorMessage}`)
      throw err
    }
  }

  const getActividadById = async (id: string) => {
    try {
      const actividad = await actividadesService.getActividadById(id)
      return actividad
    } catch (err) {
      console.error('Error fetching actividad by id:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al obtener la actividad: ${errorMessage}`)
      throw err
    }
  }

  const getEstadisticasActividades = async (visitaId: string) => {
    try {
      const stats = await actividadesService.getEstadisticasActividades(visitaId)
      return stats
    } catch (err) {
      console.error('Error getting actividades stats:', err)
      throw err
    }
  }

  // Función de utilidad para resetear el estado
  const resetActividades = () => {
    setActividades([])
    setError(null)
  }

  return {
    actividades,
    loading,
    error,
    fetchActividadesByVisita,
    createActividad,
    updateActividad,
    deleteActividad,
    getActividadById,
    getEstadisticasActividades,
    resetActividades,
    // Funciones de utilidad del servicio
    formatearNombreContacto: actividadesService.formatearNombreContacto,
    getTipoContactoLabel: actividadesService.getTipoContactoLabel
  }
}