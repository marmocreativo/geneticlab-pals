export type TicketEstado = 'abierto' | 'respondido' | 'cerrado'

export interface Ticket {
  id: string
  pal_id: string
  asunto: string
  descripcion: string
  estado: TicketEstado
  respuesta_admin: string | null
  created_at: string
  updated_at: string
  pal?: {
    id: string
    nombre_completo: string
    email: string
  }
}

export interface TicketInsert {
  pal_id: string
  asunto: string
  descripcion: string
}

export interface TicketUpdate {
  estado?: TicketEstado
  respuesta_admin?: string
}