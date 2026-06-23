export interface Actividad {
  id: string
  contacto_id?: string | null
  descripcion_actividad?: string | null
  temas_impartidos?: string | null
  entrega_sobres_id?: string | null
  entrega_kit_rash_id?: string | null
  notas?: string | null
  created_at: string
  institucion_id?: string | null
  fecha_actividad: string
  hora_actividad?: string | null
  pal_id: string
  tipo_actividad: 'presencial' | 'telefono'  // NUEVO CAMPO
  // Relaciones (sin cambios)
  contacto?: {
    id: string
    nombre: string
    apellido_pat?: string | null
    apellido_mat?: string | null
    tipo_contacto: string
  } | null
  institucion?: {
    id: string
    nombre: string
    direccion: string
  } | null
  pal?: {
    id: string
    nombre_completo: string
    email: string
  } | null
  entrega_sobres?: {
    id: string
    nombre: string
  } | null
  entrega_kit_rash?: {
    id: string
    nombre: string
  } | null
}

export interface ActividadInsert {
  contacto_id?: string
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
  institucion_id?: string | null
  fecha_actividad: string
  hora_actividad?: string
  pal_id: string
  tipo_actividad: 'presencial' | 'telefono'  // NUEVO CAMPO
}

export interface ActividadUpdate {
  contacto_id?: string
  institucion_id?: string | null
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
  fecha_actividad?: string
  hora_actividad?: string
  tipo_actividad?: 'presencial' | 'telefono'  // NUEVO CAMPO
}