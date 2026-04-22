import { supabase } from '@/lib/supabase'
import { updateLastFetch } from '@/lib/lastFetch'
import type { Visita, VisitaInsert, VisitaUpdate } from '@/types/visita'

export const visitasService = {
  async getVisitas() {
    const { data, error } = await supabase
      .from('visitas')
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud),
        pal:users(id, nombre_completo, email),
        fotos_evidencia(id, url_storage)
      `)
      .order('fecha_visita', { ascending: true })

    if (error) throw error
    updateLastFetch()
    return data as Visita[]
  },

  async getVisitasByPal(palId: string) {
    const { data, error } = await supabase
      .from('visitas')
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud)
      `)
      .eq('pal_id', palId)
      .neq('estado', 'reagendada')
      .order('fecha_visita', { ascending: true })

    if (error) throw error
    updateLastFetch()
    return data as Visita[]
  },

  async getVisitasByFecha(fecha: string, palId?: string) {
    let query = supabase
      .from('visitas')
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud)
      `)
      .gte('fecha_visita', `${fecha}T00:00:00-06:00`)
      .lte('fecha_visita', `${fecha}T23:59:59-06:00`)

    if (palId) {
      query = query.eq('pal_id', palId).neq('estado', 'reagendada')
    }

    const { data, error } = await query.order('fecha_visita', { ascending: true })

    if (error) throw error
    updateLastFetch()
    return data as Visita[]
  },

  // NUEVO MÉTODO: Obtener visitas por rango de fechas
  async getVisitasByRangoFechas(fechaInicio: string, fechaFin: string, palId?: string) {
  let query = supabase
    .from('visitas')
    .select(`
      *,
      institucion:instituciones(id, nombre, direccion, latitud, longitud),
      pal:users(id, nombre_completo, email),
      fotos_evidencia(id, url_storage)
    `)
    .gte('fecha_visita', `${fechaInicio}T00:00:00-06:00`)
    .lte('fecha_visita', `${fechaFin}T23:59:59-06:00`)

  if (palId) {
    query = query.eq('pal_id', palId).neq('estado', 'reagendada')
  }

  const { data, error } = await query.order('fecha_visita', { ascending: true })

  if (error) throw error
  updateLastFetch()
  return data as Visita[]
},

  async getVisitaById(id: string) {
    const { data, error } = await supabase
      .from('visitas')
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud),
        pal:users(id, nombre_completo, email)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    updateLastFetch()
    return data as Visita
  },

  async createVisita(visita: VisitaInsert) {
    const { data, error } = await supabase
      .from('visitas')
      .insert(visita)
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud)
      `)
      .single()

    if (error) throw error
    return data as Visita
  },

  async updateVisita(id: string, updates: VisitaUpdate) {
    const { data, error } = await supabase
      .from('visitas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        institucion:instituciones(id, nombre, direccion, latitud, longitud)
      `)
      .single()

    if (error) throw error
    return data as Visita
  },

  async deleteVisita(id: string) {
    const { error } = await supabase
      .from('visitas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async validarGPS(visitaId: string, latitud: number, longitud: number, distanciaPermitida: number) {
    // Obtener la visita con la institución
    const visita = await this.getVisitaById(visitaId)
    
    if (!visita.institucion) {
      throw new Error('No se pudo obtener la información de la institución')
    }

    // Calcular distancia usando fórmula de Haversine
    const distancia = this.calcularDistancia(
      latitud,
      longitud,
      visita.institucion.latitud,
      visita.institucion.longitud
    )

    const validacion = distancia <= distanciaPermitida

    // Actualizar la visita con los datos de validación
    // validacion_gps refleja si estuvo dentro del rango
    // gps_dispositivo siempre true porque el dispositivo respondió
    const visitaActualizada = await this.updateVisita(visitaId, {
      validacion_gps: validacion,
      gps_dispositivo: true,
      latitud_registro: latitud,
      longitud_registro: longitud,
      distancia_metros: distancia,
      fecha_hora_registro: new Date().toISOString()
    })

    // CAMBIO PRINCIPAL: Siempre devolver el resultado, no lanzar error
    return {
      ...visitaActualizada,
      distanciaCalculada: distancia,
      distanciaPermitida,
      validacionExitosa: validacion
    }
  },

  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return Math.round(R * c) // Distancia en metros, redondeada
  }
}