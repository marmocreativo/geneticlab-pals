export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'pal'

export type ContactType = 'medico' | 'enfermera' | 'cuidador' | 'paciente'

export type ContactMethod = 'presencial' | 'telefonico'

export type Periodicidad = 'semanal' | 'bisemanal'

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
          sector_id: string
          google_place_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          direccion: string
          latitud: number
          longitud: number
          sector_id: string
          google_place_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string
          latitud?: number
          longitud?: number
          sector_id?: string
          google_place_id?: string | null
          created_at?: string
        }
      }
      medicos: {
        Row: {
          id: string
          nombre_completo: string
          telefono: string | null
          numero_pm: string | null
          especialidad: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre_completo: string
          telefono?: string | null
          numero_pm?: string | null
          especialidad?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre_completo?: string
          telefono?: string | null
          numero_pm?: string | null
          especialidad?: string | null
          created_at?: string
        }
      }
      pacientes: {
        Row: {
          id: string
          nombre_completo: string
          telefono: string | null
          numero_pm: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre_completo: string
          telefono?: string | null
          numero_pm?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre_completo?: string
          telefono?: string | null
          numero_pm?: string | null
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