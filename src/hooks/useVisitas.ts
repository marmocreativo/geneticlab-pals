import { useState, useEffect } from 'react'
import { visitasService } from '@/services/visitasService'
import type { Visita, VisitaInsert, VisitaUpdate } from '@/types/visita'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

export function useVisitas() {
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, role } = useAuth()

  const fetchVisitas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data: Visita[]
      
      if (role === 'admin') {
        // Los admins ven todas las visitas
        data = await visitasService.getVisitas()
      } else {
        // Los PALs solo ven sus visitas
        data = await visitasService.getVisitasByPal(user?.id || '')
      }
      
      setVisitas(data)
    } catch (err) {
      console.error('Error fetching visitas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las visitas')
    } finally {
      setLoading(false)
    }
  }

  const fetchVisitasByFecha = async (fecha: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const palId = role === 'pal' ? user?.id : undefined
      const data = await visitasService.getVisitasByFecha(fecha, palId)
      
      setVisitas(data)
    } catch (err) {
      console.error('Error fetching visitas by fecha:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las visitas del día')
    } finally {
      setLoading(false)
    }
  }
  
const fetchVisitasByMes = async (year: number, month: number) => {
  try {
    setLoading(true)
    setError(null)
    
    // Crear fechas de inicio y fin del mes
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
    
    console.log(`🗓️ Cargando visitas del mes: ${startDate} a ${endDate}`)
    
    const palId = role === 'pal' ? user?.id : undefined
    
    // Usar el nuevo método del service
    const data = await visitasService.getVisitasByRangoFechas(startDate, endDate, palId)
    
    setVisitas(data)
    console.log(`✅ Cargadas ${data.length} visitas del mes`)
  } catch (err) {
    console.error('Error fetching visitas by mes:', err)
    setError(err instanceof Error ? err.message : 'Error desconocido')
    toast.error('Error al cargar las visitas del mes')
  } finally {
    setLoading(false)
  }
}

  const createVisita = async (visitaData: VisitaInsert) => {
    try {
      const newVisita = await visitasService.createVisita(visitaData)
      setVisitas(prev => [...prev, newVisita])
      toast.success('Visita creada exitosamente')
      return newVisita
    } catch (err) {
      console.error('Error creating visita:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al crear la visita: ${errorMessage}`)
      throw err
    }
  }

  const updateVisita = async (id: string, updates: VisitaUpdate) => {
    try {
      const updatedVisita = await visitasService.updateVisita(id, updates)
      setVisitas(prev => prev.map(visita => 
        visita.id === id ? updatedVisita : visita
      ))
      toast.success('Visita actualizada exitosamente')
      return updatedVisita
    } catch (err) {
      console.error('Error updating visita:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al actualizar la visita: ${errorMessage}`)
      throw err
    }
  }

  const deleteVisita = async (id: string) => {
    try {
      await visitasService.deleteVisita(id)
      setVisitas(prev => prev.filter(visita => visita.id !== id))
      toast.success('Visita eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting visita:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al eliminar la visita: ${errorMessage}`)
      throw err
    }
  }

  const validarGPS = async (visitaId: string, latitud: number, longitud: number, distanciaPermitida: number) => {
    try {
      const resultado = await visitasService.validarGPS(visitaId, latitud, longitud, distanciaPermitida)
      
      // Actualizar la visita en el estado local
      setVisitas(prev => prev.map(visita => 
        visita.id === visitaId ? {
          ...visita,
          validacion_gps: resultado.validacion_gps,
          latitud_registro: resultado.latitud_registro,
          longitud_registro: resultado.longitud_registro,
          distancia_metros: resultado.distancia_metros
        } : visita
      ))

      // Mostrar mensaje según el resultado
      if (resultado.validacionExitosa) {
        toast.success(`✅ Ubicación validada correctamente (${resultado.distanciaCalculada}m de la institución)`)
      } else {
        toast.warning(`📍 Estás muy lejos de la institución. Distancia actual: ${resultado.distanciaCalculada}m, máximo permitido: ${resultado.distanciaPermitida}m`)
      }

      return resultado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`❌ Error al validar ubicación: ${errorMessage}`)
      throw err
    }
  }

  const getVisitaById = async (id: string) => {
    try {
      const visita = await visitasService.getVisitaById(id)
      return visita
    } catch (err) {
      console.error('Error fetching visita by id:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al obtener la visita: ${errorMessage}`)
      throw err
    }
  }

  const confirmarAsistencia = async (visitaId: string) => {
    try {
      const updatedVisita = await visitasService.updateVisita(visitaId, {
        estado: 'asistio'
      })
      
      setVisitas(prev => prev.map(visita => 
        visita.id === visitaId ? updatedVisita : visita
      ))
      
      toast.success('Asistencia confirmada')
      return updatedVisita
    } catch (err) {
      console.error('Error confirming attendance:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al confirmar asistencia: ${errorMessage}`)
      throw err
    }
  }

  const marcarFalta = async (visitaId: string) => {
    try {
      const updatedVisita = await visitasService.updateVisita(visitaId, {
        estado: 'falto'
      })
      
      setVisitas(prev => prev.map(visita => 
        visita.id === visitaId ? updatedVisita : visita
      ))
      
      toast.success('Falta registrada')
      return updatedVisita
    } catch (err) {
      console.error('Error marking absence:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al registrar falta: ${errorMessage}`)
      throw err
    }
  }

  const fetchVisitasByDateRange = async (fechaInicio: string, fechaFin: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🗓️ Cargando visitas del período: ${fechaInicio} a ${fechaFin}`)
      
      
      const data = await visitasService.getVisitasByRangoFechas(
        format(new Date(fechaInicio), 'yyyy-MM-dd'),
        format(new Date(fechaFin), 'yyyy-MM-dd'),
        undefined
      )
      
      setVisitas(data)
      console.log(`✅ Cargadas ${data.length} visitas del período`)
    } catch (err) {
      console.error('Error fetching visitas by date range:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las visitas del período')
    } finally {
      setLoading(false)
    }
  }

  return {
    visitas,
    loading,
    error,
    fetchVisitas,
    fetchVisitasByFecha,
    fetchVisitasByMes,
    fetchVisitasByDateRange,
    createVisita,
    updateVisita,
    deleteVisita,
    validarGPS,
    getVisitaById,
    confirmarAsistencia,
    marcarFalta
  }

  
}

