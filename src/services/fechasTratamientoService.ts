import { supabase } from '@/lib/supabase'
import { updateLastFetch } from '@/lib/lastFetch'
import type { FechasTratamiento, FechasTratamientoInsert, FechasTratamientoUpdate } from '@/types/ficha'

export const fechasTratamientoService = {
  async getFechasByFicha(fichaId: string) {
    const { data, error } = await supabase
      .from('fechas_tratamiento')
      .select('*')
      .eq('ficha_id', fichaId)
      .order('fecha_programada', { ascending: true })

    if (error) throw error
    updateLastFetch()
    return data as FechasTratamiento[]
  },

  async createFecha(fecha: FechasTratamientoInsert) {
    const { data, error } = await supabase
      .from('fechas_tratamiento')
      .insert(fecha)
      .select()
      .single()

    if (error) throw error
    return data as FechasTratamiento
  },

  async updateFecha(id: string, updates: FechasTratamientoUpdate) {
    const { data, error } = await supabase
      .from('fechas_tratamiento')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as FechasTratamiento
  },

  async deleteFecha(id: string) {
    const { error } = await supabase
      .from('fechas_tratamiento')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}