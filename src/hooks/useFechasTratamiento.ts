import { useState } from 'react'
import { fechasTratamientoService } from '@/services/fechasTratamientoService'
import type { FechasTratamiento, FechasTratamientoInsert, FechasTratamientoUpdate } from '@/types/ficha'
import { toast } from 'sonner'

export function useFechasTratamiento() {
  const [fechas, setFechas] = useState<FechasTratamiento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFechasByFicha = async (fichaId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fechasTratamientoService.getFechasByFicha(fichaId)
      setFechas(data)
    } catch (err) {
      console.error('Error fetching fechas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las fechas de tratamiento')
    } finally {
      setLoading(false)
    }
  }

  const createFecha = async (fechaData: FechasTratamientoInsert) => {
    try {
      const newFecha = await fechasTratamientoService.createFecha(fechaData)
      setFechas(prev => [...prev, newFecha].sort((a, b) => 
        new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
      ))
      toast.success('Fecha de tratamiento creada exitosamente')
      return newFecha
    } catch (err) {
      console.error('Error creating fecha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al crear la fecha: ${errorMessage}`)
      throw err
    }
  }

  const updateFecha = async (id: string, updates: FechasTratamientoUpdate) => {
    try {
      const updatedFecha = await fechasTratamientoService.updateFecha(id, updates)
      setFechas(prev => prev.map(fecha => 
        fecha.id === id ? updatedFecha : fecha
      ).sort((a, b) => 
        new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
      ))
      toast.success('Fecha de tratamiento actualizada exitosamente')
      return updatedFecha
    } catch (err) {
      console.error('Error updating fecha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al actualizar la fecha: ${errorMessage}`)
      throw err
    }
  }

  const deleteFecha = async (id: string) => {
    try {
      await fechasTratamientoService.deleteFecha(id)
      setFechas(prev => prev.filter(fecha => fecha.id !== id))
      toast.success('Fecha de tratamiento eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting fecha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al eliminar la fecha: ${errorMessage}`)
      throw err
    }
  }

  return {
    fechas,
    loading,
    error,
    fetchFechasByFicha,
    createFecha,
    updateFecha,
    deleteFecha
  }
}