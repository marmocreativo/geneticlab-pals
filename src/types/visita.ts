export interface Visita {
  id: string
  pal_id: string
  institucion_id: string
  fecha_visita: string
  validacion_gps: boolean
  latitud_registro?: number
  longitud_registro?: number
  distancia_metros?: number
  estado: 'programada' | 'asistio' | 'falto'
  // tipo_visita removido - todas las visitas son presenciales
  created_at: string
  updated_at: string
  // Relaciones (sin cambios)
  institucion?: {
    id: string
    nombre: string
    direccion: string
    latitud: number
    longitud: number
  }
  pal?: {
    id: string
    nombre_completo: string
    email: string
  }
  fotos_evidencia?: { id: string; url_storage: string }[]
}

export interface VisitaInsert {
  pal_id: string
  institucion_id: string
  fecha_visita: string
  estado?: 'programada' | 'asistio' | 'falto'
  // tipo_visita removido
  validacion_gps?: boolean
  latitud_registro?: number
  longitud_registro?: number
  distancia_metros?: number
}

export interface VisitaUpdate {
  fecha_visita?: string
  estado?: 'programada' | 'asistio' | 'falto'
  // tipo_visita removido
  validacion_gps?: boolean
  latitud_registro?: number
  longitud_registro?: number
  distancia_metros?: number
}