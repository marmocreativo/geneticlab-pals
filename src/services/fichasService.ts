import { supabase } from '@/lib/supabase'
import type { FichaPaciente, FichaPacienteInsert, FichaPacienteUpdate, FechasTratamiento } from '@/types/ficha'

const SELECT_FICHA = `
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
    fecha_nacimiento,
    pal_id,
    pal:users!pal_id (
      id,
      nombre_completo
    )
  ),
  doctor:contactos!doctor_id (
    id,
    nombre,
    apellido_pat,
    apellido_mat
  )
`

export const fichasService = {
  async getFichas() {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(SELECT_FICHA)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  },

  async getFichasByInstitucion(institucionId: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(SELECT_FICHA)
      .eq('institucion_id', institucionId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  },

  async getFichaById(id: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(SELECT_FICHA)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async createFicha(ficha: FichaPacienteInsert) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .insert(ficha)
      .select(SELECT_FICHA)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async updateFicha(id: string, updates: FichaPacienteUpdate) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .update(updates)
      .eq('id', id)
      .select(SELECT_FICHA)
      .single()

    if (error) throw error
    return data as FichaPaciente
  },

  async deleteFicha(id: string) {
    const { error: errorFechas } = await supabase
      .from('fechas_tratamiento')
      .delete()
      .eq('ficha_id', id)

    if (errorFechas) throw new Error(`Error eliminando fechas de tratamiento: ${errorFechas.message}`)

    const { error: errorFichaContactos } = await supabase
      .from('ficha_contactos')
      .delete()
      .eq('ficha_id', id)

    if (errorFichaContactos) throw new Error(`Error eliminando contactos de la ficha: ${errorFichaContactos.message}`)

    const { error } = await supabase
      .from('ficha_paciente')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async buscarFichas(texto: string) {
    const { data, error } = await supabase
      .from('ficha_paciente')
      .select(SELECT_FICHA)
      .or(`folio.ilike.%${texto}%`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as FichaPaciente[]
  },

  async getFichasConFechas() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('ficha_paciente')
      .select(`
        ${SELECT_FICHA},
        fechas_tratamiento (
          id,
          fecha_programada,
          asistencia,
          estado,
          notas
        )
      `)

    if (userData?.role === 'pal') {
      query = query.eq('paciente.pal_id', user.id)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as (FichaPaciente & { fechas_tratamiento: FechasTratamiento[] })[]
  }
}