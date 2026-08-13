import { supabase } from '@/lib/supabase'
import type { Ticket, TicketInsert, TicketUpdate } from '@/types/ticket'

export const ticketsService = {
  async getTicketsByPal(palId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('pal_id', palId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Ticket[]
  },

  async getAllTickets() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        pal:users(id, nombre_completo, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Ticket[]
  },

  async createTicket(ticket: TicketInsert) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single()

    if (error) throw error
    return data as Ticket
  },

  async responderTicket(id: string, respuesta: string) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        respuesta_admin: respuesta,
        estado: 'respondido',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Ticket
  },

  async updateEstado(id: string, estado: TicketUpdate['estado']) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Ticket
  }
}