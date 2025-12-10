// services/actividadesService.ts
import { supabase } from '@/lib/supabase'
import type { Actividad, ActividadInsert, ActividadUpdate } from '@/types/actividad'

export const actividadesService = {
  // Obtener actividades por PAL - esta será la función principal
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
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
        )
      `)
      .eq('pal_id', palId)

    if (fechaInicio) {
      query = query.gte('fecha_actividad', fechaInicio)
    }
    if (fechaFin) {
      query = query.lte('fecha_actividad', fechaFin)
    }

    const { data, error } = await query
      .order('fecha_actividad', { ascending: false })
      .order('hora_actividad', { ascending: false, nullsFirst: false })

    if (error) throw error
    return data as Actividad[]
  },

  async getActividadesByInstitucion(institucionId: string, palId?: string) {
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
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
        )
      `)
      .eq('institucion_id', institucionId)

    // Si se especifica PAL, filtrar por él
    if (palId) {
      query = query.eq('pal_id', palId)
    }

    const { data, error } = await query
      .order('fecha_actividad', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Actividad[]
  },

  async getActividadesByFecha(fecha: string, palId?: string) {
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
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
        )
      `)
      .eq('fecha_actividad', fecha)

    if (palId) {
      query = query.eq('pal_id', palId)
    }

    const { data, error } = await query.order('hora_actividad', { ascending: true, nullsFirst: false })

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
        ),
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
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
        ),
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
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
        ),
        institucion:instituciones(
          id,
          nombre,
          direccion
        ),
        pal:users!actividades_pal_id_fkey(
          id,
          nombre_completo,
          email
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

  // Función de utilidad para formatear el nombre completo del contacto
  formatearNombreContacto(contacto: Actividad['contacto']): string {
    if (!contacto) return 'Sin contacto asignado'
    
    const partes = [
      contacto.nombre,
      contacto.apellido_pat,
      contacto.apellido_mat
    ].filter(Boolean)
    
    return partes.join(' ')
  },

  // Función para obtener el label según el tipo de contacto
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

  // Estadísticas de actividades por PAL
  async getEstadisticasActividades(palId: string, fechaInicio?: string, fechaFin?: string) {
    const actividades = await this.getActividadesByPal(palId, fechaInicio, fechaFin)
    
    const stats = {
      total: actividades.length,
      porTipoContacto: {} as Record<string, number>,
      porInstitucion: {} as Record<string, number>,
      conContacto: actividades.filter(a => a.contacto_id).length,
      sinContacto: actividades.filter(a => !a.contacto_id).length,
      conHora: actividades.filter(a => a.hora_actividad).length,
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
      
      // Contar por institución
      if (actividad.institucion) {
        const inst = actividad.institucion.nombre
        stats.porInstitucion[inst] = (stats.porInstitucion[inst] || 0) + 1
      }
    })

    return stats
  },

  // Formatear fecha y hora para display
  formatearFechaHora(fecha: string, hora?: string | null): string {
    const fechaFormateada = new Date(fecha).toLocaleDateString('es-MX')
    
    if (!hora) {
      return fechaFormateada
    }
    
    // Formatear hora de 24h a 12h
    const [hours, minutes] = hora.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    
    return `${fechaFormateada} - ${hour12}:${minutes} ${ampm}`
  }
}