import { useState, useEffect } from 'react'
import { fichasService } from '@/services/fichasService'
import type { FichaPaciente, FichaPacienteInsert, FichaPacienteUpdate } from '@/types/ficha'
import { toast } from 'sonner'

export function useFichas() {
  const [fichas, setFichas] = useState<FichaPaciente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFichas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fichasService.getFichas()
      setFichas(data)
    } catch (err) {
      console.error('Error fetching fichas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al cargar las fichas')
    } finally {
      setLoading(false)
    }
  }

  const createFicha = async (fichaData: FichaPacienteInsert) => {
    try {
      const newFicha = await fichasService.createFicha(fichaData)
      setFichas(prev => [newFicha, ...prev])
      toast.success('Ficha creada exitosamente')
      return newFicha
    } catch (err) {
      console.error('Error creating ficha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al crear la ficha: ${errorMessage}`)
      throw err
    }
  }

  const updateFicha = async (id: string, updates: FichaPacienteUpdate) => {
    try {
      const updatedFicha = await fichasService.updateFicha(id, updates)
      setFichas(prev => prev.map(ficha => 
        ficha.id === id ? updatedFicha : ficha
      ))
      toast.success('Ficha actualizada exitosamente')
      return updatedFicha
    } catch (err) {
      console.error('Error updating ficha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al actualizar la ficha: ${errorMessage}`)
      throw err
    }
  }

  const deleteFicha = async (id: string) => {
    try {
      await fichasService.deleteFicha(id)
      setFichas(prev => prev.filter(ficha => ficha.id !== id))
      toast.success('Ficha eliminada exitosamente')
    } catch (err) {
      console.error('Error deleting ficha:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al eliminar la ficha: ${errorMessage}`)
      throw err
    }
  }

  const buscarFichas = async (texto: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fichasService.buscarFichas(texto)
      setFichas(data)
    } catch (err) {
      console.error('Error searching fichas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      toast.error('Error al buscar fichas')
    } finally {
      setLoading(false)
    }
  }

  const getFichaById = async (id: string) => {
    try {
      const ficha = await fichasService.getFichaById(id)
      return ficha
    } catch (err) {
      console.error('Error fetching ficha by id:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      toast.error(`Error al obtener la ficha: ${errorMessage}`)
      throw err
    }
  }

  useEffect(() => {
    fetchFichas()
  }, [])

  return {
    fichas,
    loading,
    error,
    fetchFichas,
    createFicha,
    updateFicha,
    deleteFicha,
    buscarFichas,
    getFichaById
  }
}