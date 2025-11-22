export interface Contacto {
  id: string
  tipo_contacto: 'medico' | 'paciente' | 'familiar' | 'cuidador' | 'enfermera' | 'enfermero'
  relacion_con_paciente?: string
  nombre: string
  apellido_pat?: string
  apellido_mat?: string
  telefono?: string
  fecha_nacimiento?: string
  institucion_id?: string
  created_at: string
  // Relaciones
  institucion?: {
    id: string
    nombre: string
  }
}

export interface ContactoInsert {
  tipo_contacto: 'medico' | 'paciente' | 'familiar' | 'cuidador' | 'enfermera' | 'enfermero'
  relacion_con_paciente?: string
  nombre: string
  apellido_pat?: string
  apellido_mat?: string
  telefono?: string
  fecha_nacimiento?: string
  institucion_id?: string
}

export interface ContactoUpdate {
  tipo_contacto?: 'medico' | 'paciente' | 'familiar' | 'cuidador' | 'enfermera' | 'enfermero'
  relacion_con_paciente?: string
  nombre?: string
  apellido_pat?: string
  apellido_mat?: string
  telefono?: string
  fecha_nacimiento?: string
  institucion_id?: string
}