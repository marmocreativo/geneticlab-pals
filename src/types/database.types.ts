export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'pal'

export type TipoContacto = 'medico' | 'paciente' | 'familiar' | 'cuidador' | 'enfermera' | 'enfermero' | 'kam' | 'otro'

export type TipoActividad = 'presencial' | 'telefono'

export type EstadoVisita = 'programada' | 'asistio' | 'falto' | 'reagendada'

export type StatusFicha = 'en_tx' | 'fuera_tx'

export type PeriodicidadFicha = 'semanal' | 'cada_2_semanas' | 'cada_3_semanas' | 'cada_4_semanas'

export type CatalogoTipo = 
  | 'diagnostico'
  | 'terapia'
  | 'sector'
  | 'kit_rash'
  | 'torre_control'
  | 'descripcion_actividad'
  | 'temas_impartidos'
  | 'entrega_sobres'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          nombre_completo: string
          telefono: string | null
          activo: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          nombre_completo: string
          telefono?: string | null
          activo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          nombre_completo?: string
          telefono?: string | null
          activo?: boolean
          created_at?: string
        }
      }
      catalogos: {
        Row: {
          id: string
          tipo: CatalogoTipo
          nombre: string
          activo: boolean
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          tipo: CatalogoTipo
          nombre: string
          activo?: boolean
          orden?: number
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: CatalogoTipo
          nombre?: string
          activo?: boolean
          orden?: number
          created_at?: string
        }
      }
      instituciones: {
        Row: {
          id: string
          nombre: string
          direccion: string
          latitud: number
          longitud: number
          sector_id: string | null
          google_place_id: string | null
          photo_reference: string | null
          estado: string | null
          ciudad: string | null
          municipio: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          direccion: string
          latitud: number
          longitud: number
          sector_id?: string | null
          google_place_id?: string | null
          photo_reference?: string | null
          estado?: string | null
          ciudad?: string | null
          municipio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string
          latitud?: number
          longitud?: number
          sector_id?: string | null
          google_place_id?: string | null
          photo_reference?: string | null
          estado?: string | null
          ciudad?: string | null
          municipio?: string | null
          created_at?: string
        }
      }
      contactos: {
        Row: {
          id: string
          tipo_contacto: TipoContacto
          relacion_con_paciente: string | null
          nombre: string
          apellido_pat: string | null
          apellido_mat: string | null
          telefono: string | null
          fecha_nacimiento: string | null
          institucion_id: string | null
          pal_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tipo_contacto: TipoContacto
          relacion_con_paciente?: string | null
          nombre: string
          apellido_pat?: string | null
          apellido_mat?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          institucion_id?: string | null
          pal_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tipo_contacto?: TipoContacto
          relacion_con_paciente?: string | null
          nombre?: string
          apellido_pat?: string | null
          apellido_mat?: string | null
          telefono?: string | null
          fecha_nacimiento?: string | null
          institucion_id?: string | null
          pal_id?: string | null
          created_at?: string
        }
      }
      visitas: {
        Row: {
          id: string
          pal_id: string
          institucion_id: string | null
          fecha_visita: string
          validacion_gps: boolean
          latitud_registro: number | null
          longitud_registro: number | null
          distancia_metros: number | null
          estado: EstadoVisita
          created_at: string
          updated_at: string
          notas_reagendado: string | null
          reagendado_de: string | null
          gps_dispositivo: boolean
          fecha_hora_registro: string | null
        }
        Insert: {
          id?: string
          pal_id: string
          institucion_id?: string | null
          fecha_visita: string
          validacion_gps?: boolean
          latitud_registro?: number | null
          longitud_registro?: number | null
          distancia_metros?: number | null
          estado?: EstadoVisita
          created_at?: string
          updated_at?: string
          notas_reagendado?: string | null
          reagendado_de?: string | null
          gps_dispositivo?: boolean
          fecha_hora_registro?: string | null
        }
        Update: {
          id?: string
          pal_id?: string
          institucion_id?: string | null
          fecha_visita?: string
          validacion_gps?: boolean
          latitud_registro?: number | null
          longitud_registro?: number | null
          distancia_metros?: number | null
          estado?: EstadoVisita
          created_at?: string
          updated_at?: string
          notas_reagendado?: string | null
          reagendado_de?: string | null
          gps_dispositivo?: boolean
          fecha_hora_registro?: string | null
        }
      }
      ficha_paciente: {
        Row: {
          id: string
          folio: string
          institucion_id: string
          paciente_id: string
          doctor_id: string | null
          diagnostico: string | null
          terapia: string | null
          dosis: string | null
          fecha_inicio_tratamiento: string | null
          numero_pm: string | null
          status: StatusFicha
          periodicidad: PeriodicidadFicha | null
          fecha_final_tratamiento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folio?: string
          institucion_id: string
          paciente_id: string
          doctor_id?: string | null
          diagnostico?: string | null
          terapia?: string | null
          dosis?: string | null
          fecha_inicio_tratamiento?: string | null
          numero_pm?: string | null
          status?: StatusFicha
          periodicidad?: PeriodicidadFicha | null
          fecha_final_tratamiento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folio?: string
          institucion_id?: string
          paciente_id?: string
          doctor_id?: string | null
          diagnostico?: string | null
          terapia?: string | null
          dosis?: string | null
          fecha_inicio_tratamiento?: string | null
          numero_pm?: string | null
          status?: StatusFicha
          periodicidad?: PeriodicidadFicha | null
          fecha_final_tratamiento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      ficha_contactos: {
        Row: {
          id: string
          ficha_id: string
          contacto_id: string
          created_at: string
        }
        Insert: {
          id?: string
          ficha_id: string
          contacto_id: string
          created_at?: string
        }
        Update: {
          id?: string
          ficha_id?: string
          contacto_id?: string
          created_at?: string
        }
      }
      fechas_tratamiento: {
        Row: {
          id: string
          ficha_id: string
          fecha_programada: string
          asistencia: boolean
          estado: 'pendiente' | 'asistio' | 'falto'
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ficha_id: string
          fecha_programada: string
          asistencia?: boolean
          estado?: 'pendiente' | 'asistio' | 'falto'
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ficha_id?: string
          fecha_programada?: string
          asistencia?: boolean
          estado?: 'pendiente' | 'asistio' | 'falto'
          notas?: string | null
          created_at?: string
        }
      }
      actividades: {
        Row: {
          id: string
          contacto_id: string | null
          institucion_id: string | null
          pal_id: string
          fecha_actividad: string
          hora_actividad: string | null
          tipo_actividad: TipoActividad
          descripcion_actividad: string | null
          temas_impartidos: string | null
          entrega_sobres_id: string | null
          entrega_kit_rash_id: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contacto_id?: string | null
          institucion_id?: string | null
          pal_id: string
          fecha_actividad?: string
          hora_actividad?: string | null
          tipo_actividad?: TipoActividad
          descripcion_actividad?: string | null
          temas_impartidos?: string | null
          entrega_sobres_id?: string | null
          entrega_kit_rash_id?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contacto_id?: string | null
          institucion_id?: string | null
          pal_id?: string
          fecha_actividad?: string
          hora_actividad?: string | null
          tipo_actividad?: TipoActividad
          descripcion_actividad?: string | null
          temas_impartidos?: string | null
          entrega_sobres_id?: string | null
          entrega_kit_rash_id?: string | null
          notas?: string | null
          created_at?: string
        }
      }
      fotos_evidencia: {
        Row: {
          id: string
          visita_id: string
          url_storage: string
          created_at: string
        }
        Insert: {
          id?: string
          visita_id: string
          url_storage: string
          created_at?: string
        }
        Update: {
          id?: string
          visita_id?: string
          url_storage?: string
          created_at?: string
        }
      }
      configuraciones: {
        Row: {
          id: string
          clave: string
          valor: string
          tipo: 'numero' | 'texto' | 'boolean'
          descripcion: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          clave: string
          valor: string
          tipo: 'numero' | 'texto' | 'boolean'
          descripcion?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          clave?: string
          valor?: string
          tipo?: 'numero' | 'texto' | 'boolean'
          descripcion?: string | null
          updated_at?: string
        }
      }
    }
  }
}