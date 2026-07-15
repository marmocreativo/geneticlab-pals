export interface VideoAyuda {
  titulo: string
  archivo: string
}

export const videosAyuda: Record<string, VideoAyuda[]> = {
  '/pal': [
    { titulo: 'Introducción al sistema', archivo: 'inicio_final.mp4' },
    { titulo: 'Actualización contactos', archivo: 'actualizacion_contactos.mp4' }
  ],
  '/pal/calendario': [
    { titulo: 'Cómo agendar una visita', archivo: 'agendar_final.mp4' },
    { titulo: 'Registrar asistencia', archivo: 'asistencia_final.mp4' }
  ],
  '/pal/actividades': [
    { titulo: 'Registro de actividades', archivo: 'actividades_final.mp4' }
  ],
  '/pal/pacientes': [
    { titulo: 'Censo de pacientes', archivo: 'censo_final.mp4' }
  ]
}

export const videoPopup: VideoAyuda = {
  titulo: 'Actualización contactos',
  archivo: 'actualizacion_contactos.mp4'
}