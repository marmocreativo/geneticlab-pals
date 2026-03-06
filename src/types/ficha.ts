export interface FichaPaciente {
  fechas_tratamiento: any
  id: string
  folio: string
  institucion_id: string
  paciente_id: string
  doctor_id?: string
  diagnostico?: string
  terapia?: string
  dosis?: string
  fecha_inicio_tratamiento?: string
  created_at: string
  updated_at: string
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
  doctor?: {
    id: string
    nombre: string
    apellido_pat?: string
    apellido_mat?: string
  }
}

export interface FichaPacienteInsert {
  institucion_id: string
  paciente_id: string
  doctor_id?: string
  diagnostico?: string
  terapia?: string
  dosis: string
  fecha_inicio_tratamiento: string
}

export interface FichaPacienteUpdate {
  institucion_id?: string
  paciente_id?: string
  doctor_id?: string
  diagnostico?: string
  terapia?: string
  dosis?: string
  fecha_inicio_tratamiento?: string
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