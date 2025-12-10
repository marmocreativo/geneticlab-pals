export interface Actividad {
  id: string
  pal_id: string                   // Nueva: ID del PAL
  institucion_id: string
  contacto_id?: string | null
  fecha_actividad: string
  hora_actividad?: string | null
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
  created_at: string
  // Relaciones
  contacto?: {
    id: string
    nombre: string
    apellido_pat?: string
    apellido_mat?: string
    tipo_contacto: string
  } | null
  institucion?: {
    id: string
    nombre: string
    direccion: string
  }
  pal?: {                          // Nueva: relación con PAL
    id: string
    nombre_completo: string
    email: string
  }
}

export interface ActividadInsert {
  pal_id: string                   // Nueva: requerida
  institucion_id: string
  contacto_id?: string | null
  fecha_actividad: string
  hora_actividad?: string | null
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
}

export interface ActividadUpdate {
  contacto_id?: string | null
  fecha_actividad?: string
  hora_actividad?: string | null
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
}