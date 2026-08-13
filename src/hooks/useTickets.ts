import { useState } from 'react'
import { ticketsService } from '@/services/ticketsService'
import { logError, parseError } from '@/lib/errorHandler'
import type { Ticket, TicketInsert } from '@/types/ticket'
import { toast } from 'sonner'

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTicketsByPal = async (palId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketsService.getTicketsByPal(palId)
      setTickets(data)
    } catch (err) {
      console.error('Error fetching tickets:', err)
      const errorMessage = parseError(err)
      await logError('useTickets.fetchTicketsByPal', err)
      setError(errorMessage)
      toast.error('Error al cargar tus reportes')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketsService.getAllTickets()
      setTickets(data)
    } catch (err) {
      console.error('Error fetching all tickets:', err)
      const errorMessage = parseError(err)
      await logError('useTickets.fetchAllTickets', err)
      setError(errorMessage)
      toast.error('Error al cargar los tickets')
    } finally {
      setLoading(false)
    }
  }

  const createTicket = async (ticketData: TicketInsert) => {
    try {
      const newTicket = await ticketsService.createTicket(ticketData)
      setTickets(prev => [newTicket, ...prev])
      toast.success('Reporte enviado exitosamente')
      return newTicket
    } catch (err) {
      console.error('Error creating ticket:', err)
      const errorMessage = parseError(err)
      await logError('useTickets.createTicket', err)
      toast.error(`Error al enviar el reporte: ${errorMessage}`)
      throw err
    }
  }

  const responderTicket = async (id: string, respuesta: string) => {
    try {
      const updated = await ticketsService.responderTicket(id, respuesta)
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
      toast.success('Respuesta enviada')
      return updated
    } catch (err) {
      console.error('Error responding ticket:', err)
      const errorMessage = parseError(err)
      await logError('useTickets.responderTicket', err)
      toast.error(`Error al responder: ${errorMessage}`)
      throw err
    }
  }

  const cerrarTicket = async (id: string) => {
    try {
      const updated = await ticketsService.updateEstado(id, 'cerrado')
      setTickets(prev => prev.map(t => t.id === id ? updated : t))
      toast.success('Ticket cerrado')
      return updated
    } catch (err) {
      console.error('Error closing ticket:', err)
      const errorMessage = parseError(err)
      await logError('useTickets.cerrarTicket', err)
      toast.error(`Error al cerrar: ${errorMessage}`)
      throw err
    }
  }

  return {
    tickets,
    loading,
    error,
    fetchTicketsByPal,
    fetchAllTickets,
    createTicket,
    responderTicket,
    cerrarTicket
  }
}