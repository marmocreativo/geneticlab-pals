import { supabase } from '@/lib/supabase'
import type { FichaPaciente, FichaPacienteInsert, FichaPacienteUpdate } from '@/types/ficha'

export const fichasService = {
  async getFichas() {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  },

  async getFichasByInstitucion(institucionId: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .eq('institucion_id', institucionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  },

  async getFichaById(id: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async createFicha(ficha: FichaPacienteInsert) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .insert(ficha)
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async updateFicha(id: string, updates: FichaPacienteUpdate) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async deleteFicha(id: string) {
    const { error } = await supabase
      .from('ficha_paciente')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async buscarFichas(texto: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre
        ),
        paciente:contactos!paciente_id (
          id,
          nombre,
          apellido_pat,
          apellido_mat,
          telefono,
          fecha_nacimiento
        )
      `)
      .or(`folio.ilike.%${texto}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  }
}