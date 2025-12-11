export interface FichaPaciente {
  id: string
  folio: string
  institucion_id: string
  paciente_id: string
  diagnostico?: string
  terapia?: string
  created_at: string
  updated_at: string
  // Relaciones
  institucion?: {
    id: string
    nombre: string
  }
  paciente?: {
    id: string
    nombre: string
    apellido_pat?: string
    apellido_mat?: string
    telefono?: string
    fecha_nacimiento?: string
  }
}

export interface FichaPacienteInsert {
  institucion_id: string
  paciente_id: string
  diagnostico?: string
  terapia?: string
}

export interface FichaPacienteUpdate {
  institucion_id?: string
  paciente_id?: string
  diagnostico?: string
  terapia?: string
}

export interface FechasTratamiento {
  id: string
  ficha_id: string
  fecha_programada: string
  asistencia: boolean
  notas?: string
  created_at: string
}

export interface FechasTratamientoInsert {
  ficha_id: string
  fecha_programada: string
  asistencia?: boolean
  notas?: string
}

export interface FechasTratamiento {
  id: string
  ficha_id: string
  fecha_programada: string
  asistencia: boolean
  notas?: string
  created_at: string
}

export interface FechasTratamientoInsert {
  ficha_id: string
  fecha_programada: string
  asistencia?: boolean
  notas?: string
}

export interface FechasTratamientoUpdate {
  fecha_programada?: string
  asistencia?: boolean
  notas?: string
}