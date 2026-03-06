export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Control PALs'

export const GPS_MAX_DISTANCE = Number(import.meta.env.VITE_GPS_MAX_DISTANCE) || 100

export const ROLES = {
  ADMIN: 'admin',
  PAL: 'pal'
} as const

export const CONTACT_TYPES = {
  MEDICO: 'medico',
  ENFERMERA: 'enfermera',
  CUIDADOR: 'cuidador',
  PACIENTE: 'paciente',
  KAM: 'kam',
} as const

export const CONTACT_METHODS = {
  PRESENCIAL: 'presencial',
  TELEFONICO: 'telefonico'
} as const

export const PERIODICIDAD = {
  SEMANAL: 'semanal',
  BISEMANAL: 'bisemanal'
} as const

export const CATALOGO_TIPOS = {
  DIAGNOSTICO: 'diagnostico',
  TERAPIA: 'terapia',
  SECTOR: 'sector',
  KIT_RASH: 'kit_rash',
  TORRE_CONTROL: 'torre_control',
  DESCRIPCION_ACTIVIDAD: 'descripcion_actividad',
  TEMAS_IMPARTIDOS: 'temas_impartidos',
  ENTREGA_SOBRES: 'entrega_sobres'
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN: {
    DASHBOARD: '/admin',
    USUARIOS: '/admin/usuarios',
    CATALOGOS: '/admin/catalogos',
    INSTITUCIONES: '/admin/instituciones',
    CONFIGURACIONES: '/admin/configuraciones',
    REPORTES: '/admin/reportes'
  },
  PAL: {
    DASHBOARD: '/pal',
    CONTACTOS: '/pal/contactos',
    NUEVO_CONTACTO: '/pal/contactos/nuevo',
    INSTITUCIONES: '/pal/instituciones',
    FICHAS: '/pal/fichas'
  }
} as const