import { useState, useEffect } from 'react'
import { contactosService } from '@/services/contactosService'
import { logError, parseError } from '@/lib/errorHandler'
import type { Contacto, ContactoInsert, ContactoUpdate } from '@/types/contacto'
import { toast } from 'sonner'

export function useContactos() {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContactos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactosService.getContactos()
      setContactos(data)
    } catch (err) {
      console.error('Error fetching contactos:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.fetchContactos', err)
      setError(errorMessage)
      toast.error('Error al cargar los contactos')
    } finally {
      setLoading(false)
    }
  }

  const fetchContactosByTipo = async (tipo: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactosService.getContactosByTipo(tipo)
      setContactos(data)
    } catch (err) {
      console.error('Error fetching contactos by tipo:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.fetchContactosByTipo', err)
      setError(errorMessage)
      toast.error('Error al cargar los contactos por tipo')
    } finally {
      setLoading(false)
    }
  }

  const createContacto = async (contactoData: ContactoInsert) => {
    try {
      const newContacto = await contactosService.createContacto(contactoData)
      setContactos(prev => [...prev, newContacto])
      toast.success('Contacto creado exitosamente')
      return newContacto
    } catch (err) {
      console.error('Error creating contacto:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.createContacto', err)
      toast.error(`Error al crear el contacto: ${errorMessage}`)
      throw err
    }
  }

  const updateContacto = async (id: string, updates: ContactoUpdate) => {
    try {
      const updatedContacto = await contactosService.updateContacto(id, updates)
      setContactos(prev => prev.map(contacto => 
        contacto.id === id ? updatedContacto : contacto
      ))
      toast.success('Contacto actualizado exitosamente')
      return updatedContacto
    } catch (err) {
      console.error('Error updating contacto:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.updateContacto', err)
      toast.error(`Error al actualizar contacto: ${errorMessage}`)
      throw err
    }
  }

  const deleteContacto = async (id: string) => {
    try {
      await contactosService.deleteContacto(id)
      setContactos(prev => prev.filter(contacto => contacto.id !== id))
      toast.success('Contacto eliminado exitosamente')
    } catch (err) {
      console.error('Error deleting contacto:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.deleteContacto', err)
      toast.error(`Error al borrar contacto: ${errorMessage}`)
      throw err
    }
  }

  const buscarContactos = async (texto: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await contactosService.buscarContactos(texto)
      setContactos(data)
    } catch (err) {
      console.error('Error searching contactos:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.buscarContactos', err)
      setError(errorMessage)
      toast.error('Error al buscar contactos')
    } finally {
      setLoading(false)
    }
  }

  const getContactoById = async (id: string) => {
    try {
      const contacto = await contactosService.getContactoById(id)
      return contacto
    } catch (err) {
      console.error('Error fetching contacto by id:', err)
      const errorMessage = parseError(err)
      await logError('useContactos.getContactoById', err)
      toast.error(`Error al obtener el contacto: ${errorMessage}`)
      throw err
    }
  }

  useEffect(() => {
    fetchContactos()
  }, [])

  return {
    contactos,
    loading,
    error,
    fetchContactos,
    fetchContactosByTipo,
    createContacto,
    updateContacto,
    deleteContacto,
    buscarContactos,
    getContactoById,
    // Métodos de utilidad
    calcularEdad: contactosService.calcularEdad,
    formatearNombreCompleto: contactosService.formatearNombreCompleto
  }
}