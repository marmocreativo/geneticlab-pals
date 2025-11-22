export interface Actividad {
  id: string
  visita_id: string
  contacto_id: string
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
  }
}

export interface ActividadInsert {
  visita_id: string
  contacto_id: string
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
}

export interface ActividadUpdate {
  descripcion_actividad?: string
  temas_impartidos?: string
  entrega_sobres_id?: string
  entrega_kit_rash_id?: string
  notas?: string
}