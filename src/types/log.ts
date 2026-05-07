export interface Log {
  id: string
  created_at: string
  user_id: string | null
  nivel: 'error' | 'warn' | 'info'
  contexto: string
  mensaje: string
  detalle: Record<string, any> | null
}