import { supabase } from '@/lib/supabase'
import type { FichaPaciente, FichaPacienteInsert, FichaPacienteUpdate, FechasTratamiento  } from '@/types/ficha'

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
  },

  async getFichasConFechas() {
    // Obtener el usuario actual y su rol
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
        ),
        fechas_tratamiento (
          id,
          fecha_programada,
          asistencia,
          notas
        )
      `)

    // Si es PAL, filtrar por contactos que pertenecen al PAL
    if (userData?.role === 'pal') {
      // Filtrar por contactos que el PAL creó
      query = query.eq('paciente.pal_id', user.id)
    }
    
    // Si es admin, mostrar todas las fichas (no agregar filtro)

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as (FichaPaciente & { fechas_tratamiento: FechasTratamiento[] })[]
  }
}