import { supabase } from '@/lib/supabase'
import type { Log } from '@/types/log'

export const logsService = {
  async getLogs(filtros?: {
    userId?: string
    contexto?: string
    nivel?: string
    fechaInicio?: string
    fechaFin?: string
    limit?: number
  }) {
    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(filtros?.limit || 200)

    if (filtros?.userId) query = query.eq('user_id', filtros.userId)
    if (filtros?.nivel) query = query.eq('nivel', filtros.nivel)
    if (filtros?.contexto) query = query.ilike('contexto', `%${filtros.contexto}%`)
    if (filtros?.fechaInicio) query = query.gte('created_at', filtros.fechaInicio)
    if (filtros?.fechaFin) query = query.lte('created_at', filtros.fechaFin)

    const { data, error } = await query
    if (error) throw error
    return data as Log[]
  }
}