// services/actividadesService.ts
import { supabase } from '@/lib/supabase'
import type { Actividad, ActividadInsert, ActividadUpdate } from '@/types/actividad'

export const actividadesService = {
  // Obtener todas las actividades para admin
  async getAllActividades() {
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
      pal:users(
        id,
        nombre_completo,
        email
      ),
      entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
        id,
        nombre
      ),
      entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
        id,
        nombre
      )
    `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Actividad[]
  },

  // Obtener actividades por PAL
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
      pal:users(
        id,
        nombre_completo,
        email
      ),
      entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
        id,
        nombre
      ),
      entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
        id,
        nombre
      )
    `)
      .eq('pal_id', palId)

    if (fechaInicio) {
      query = query.gte('fecha_actividad', fechaInicio)
    }
    if (fechaFin) {
      query = query.lte('fecha_actividad', fechaFin)
    }

    const { data, error } = await query.order('fecha_actividad', { ascending: false })

    if (error) throw error
    return data as Actividad[]
  },

  // Obtener actividades por institución
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
        pal:users(
          id,
          nombre_completo,
          email
        ),
        entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
          id,
          nombre
        ),
        entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
          id,
          nombre
        )
      `)
      .eq('institucion_id', institucionId)

    if (palId) {
      query = query.eq('pal_id', palId)
    }

    const { data, error } = await query.order('fecha_actividad', { ascending: false })

    if (error) throw error
    return data as Actividad[]
  },

  // Obtener actividades por fecha
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
        pal:users(
          id,
          nombre_completo,
          email
        ),
        entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
          id,
          nombre
        ),
        entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
          id,
          nombre
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
        pal:users(
          id,
          nombre_completo,
          email
        ),
        entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
          id,
          nombre
        ),
        entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
          id,
          nombre
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
        pal:users(
          id,
          nombre_completo,
          email
        ),
        entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
          id,
          nombre
        ),
        entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
          id,
          nombre
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
        pal:users(
          id,
          nombre_completo,
          email
        ),
        entrega_sobres:catalogos!actividades_entrega_sobres_id_fkey(
          id,
          nombre
        ),
        entrega_kit_rash:catalogos!actividades_entrega_kit_rash_id_fkey(
          id,
          nombre
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

  formatearNombreContacto(contacto: Actividad['contacto']): string {
    if (!contacto) return 'Sin contacto asignado'
    
    const partes = [
      contacto.nombre,
      contacto.apellido_pat,
      contacto.apellido_mat
    ].filter(Boolean)
    
    return partes.join(' ')
  },

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

  async getEstadisticasActividades(palId?: string, fechaInicio?: string, fechaFin?: string) {
    const actividades = palId 
      ? await this.getActividadesByPal(palId, fechaInicio, fechaFin)
      : await this.getAllActividades()
    
    const stats = {
      total: actividades.length,
      porTipoContacto: {} as Record<string, number>,
      porInstitucion: {} as Record<string, number>,
      conContacto: actividades.filter(a => a.contacto_id).length,
      sinContacto: actividades.filter(a => !a.contacto_id).length,
      conDescripcionActividad: actividades.filter(a => a.descripcion_actividad).length,
      conTemasImpartidos: actividades.filter(a => a.temas_impartidos).length,
      conEntregaSobres: actividades.filter(a => a.entrega_sobres_id).length,
      conEntregaKitRash: actividades.filter(a => a.entrega_kit_rash_id).length,
      conNotas: actividades.filter(a => a.notas).length
    }

    actividades.forEach(actividad => {
      if (actividad.contacto) {
        const tipo = actividad.contacto.tipo_contacto
        stats.porTipoContacto[tipo] = (stats.porTipoContacto[tipo] || 0) + 1
      }
      
      if (actividad.institucion) {
        const inst = actividad.institucion.nombre
        stats.porInstitucion[inst] = (stats.porInstitucion[inst] || 0) + 1
      }
    })

    return stats
  },

  formatearFechaHora(actividad: Actividad): string {
    if (!actividad.fecha_actividad) {
      return 'Fecha no disponible'
    }
    
    const fecha = new Date(actividad.fecha_actividad)
    let result = fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    
    if (actividad.hora_actividad) {
      const [hours, minutes] = actividad.hora_actividad.split(':')
      const hour24 = parseInt(hours)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      result += ` - ${hour12}:${minutes} ${ampm}`
    }
    
    return result
  },

  getTipoActividadLabel(tipoActividad: string): string {
     const labels: Record<string, string> = {
       'presencial': 'Presencial',
       'telefono': 'Telefónica'
     }
     
     return labels[tipoActividad] || tipoActividad
   },
   
   // También actualizar formatearFechaHora para incluir el tipo si lo necesitas
   formatearFechaHoraConTipo(actividad: Actividad): string {
     const fechaHora = this.formatearFechaHora(actividad)
     const tipo = this.getTipoActividadLabel(actividad.tipo_actividad)
     return `${fechaHora} (${tipo})`
   }
}