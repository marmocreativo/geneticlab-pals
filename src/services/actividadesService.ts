import { supabase } from '@/lib/supabase'
import type { Actividad, ActividadInsert, ActividadUpdate } from '@/types/actividad'

export const actividadesService = {
  async getActividadesByVisita(visitaId: string) {
    const { data, error } = await supabase
      .from('actividades')
      .select(`
        *,
        contacto:contactos(
          id, 
          nombre, 
          apellido_pat, 
          apellido_mat, 
          tipo_contacto
        )
      `)
      .eq('visita_id', visitaId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Actividad[]
  },

  async getActividadById(id: string) {
    const { data, error } = await supabase
      .from('actividades')
      .select(`
        *,
        contacto:contactos(
          id, 
          nombre, 
          apellido_pat, 
          apellido_mat, 
          tipo_contacto
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Actividad
  },

  async createActividad(actividad: ActividadInsert) {
    const { data, error } = await supabase
      .from('actividades')
      .insert(actividad)
      .select(`
        *,
        contacto:contactos(
          id, 
          nombre, 
          apellido_pat, 
          apellido_mat, 
          tipo_contacto
        )
      `)
      .single()

    if (error) throw error
    return data as Actividad
  },

  async updateActividad(id: string, updates: ActividadUpdate) {
    const { data, error } = await supabase
      .from('actividades')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        contacto:contactos(
          id, 
          nombre, 
          apellido_pat, 
          apellido_mat, 
          tipo_contacto
        )
      `)
      .single()

    if (error) throw error
    return data as Actividad
  },

  async deleteActividad(id: string) {
    const { error } = await supabase
      .from('actividades')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Obtener actividades por PAL (para reportes)
  async getActividadesByPal(palId: string, fechaInicio?: string, fechaFin?: string) {
    let query = supabase
      .from('actividades')
      .select(`
        *,
        contacto:contactos(
          id, 
          nombre, 
          apellido_pat, 
          apellido_mat, 
          tipo_contacto
        ),
        visita:visitas(
          id,
          fecha_visita,
          institucion:instituciones(id, nombre)
        )
      `)
      .eq('visitas.pal_id', palId)

    if (fechaInicio) {
      query = query.gte('visitas.fecha_visita', fechaInicio)
    }
    if (fechaFin) {
      query = query.lte('visitas.fecha_visita', fechaFin)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as (Actividad & {
      visita: {
        id: string
        fecha_visita: string
        institucion: {
          id: string
          nombre: string
        }
      }
    })[]
  },

  // Función de utilidad para formatear el nombre completo del contacto
  formatearNombreContacto(contacto: Actividad['contacto']): string {
    if (!contacto) return 'Sin contacto'
    
    const partes = [
      contacto.nombre,
      contacto.apellido_pat,
      contacto.apellido_mat
    ].filter(Boolean)
    
    return partes.join(' ')
  },

  // Función para obtener el ícono según el tipo de contacto
  getTipoContactoLabel(tipoContacto: string): string {
    const labels: Record<string, string> = {
      'medico': 'Médico',
      'paciente': 'Paciente',
      'familiar': 'Familiar',
      'cuidador': 'Cuidador',
      'enfermera': 'Enfermera',
      'enfermero': 'Enfermero'
    }
    
    return labels[tipoContacto] || tipoContacto
  },

  // Estadísticas de actividades para una visita
  async getEstadisticasActividades(visitaId: string) {
    const actividades = await this.getActividadesByVisita(visitaId)
    
    const stats = {
      total: actividades.length,
      porTipoContacto: {} as Record<string, number>,
      conDescripcionActividad: actividades.filter(a => a.descripcion_actividad).length,
      conTemasImpartidos: actividades.filter(a => a.temas_impartidos).length,
      conEntregaSobres: actividades.filter(a => a.entrega_sobres_id).length,
      conEntregaKitRash: actividades.filter(a => a.entrega_kit_rash_id).length,
      conNotas: actividades.filter(a => a.notas).length
    }

    // Contar por tipo de contacto
    actividades.forEach(actividad => {
      if (actividad.contacto) {
        const tipo = actividad.contacto.tipo_contacto
        stats.porTipoContacto[tipo] = (stats.porTipoContacto[tipo] || 0) + 1
      }
    })

    return stats
  }
}