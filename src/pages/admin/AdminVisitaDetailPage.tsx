import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, MapPin, User, Calendar, CheckCircle,
  XCircle, Clock, Loader2, Navigation, Camera, Activity
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { visitasService } from '@/services/visitasService'
import { actividadesService } from '@/services/actividadesService'
import { fotosEvidenciaService } from '@/services/fotosEvidenciaService'
import type { Visita } from '@/types/visita'
import type { Actividad } from '@/types/actividad'
import { cn } from '@/lib/utils'

const iconoHospital = L.divIcon({
  className: '',
  html: `<div style="background:#1d71b8;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

const iconoUsuario = L.divIcon({
  className: '',
  html: `<div style="background:#e8308a;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function FitBounds({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (puntos.length < 2) return
    map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] })
  }, [puntos, map])
  return null
}

const ESTADO_LABELS: Record<string, string> = {
  programada: 'Programada',
  asistio: 'Asistió',
  falto: 'Faltó',
}

const ESTADO_COLORS: Record<string, string> = {
  programada: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  asistio: 'bg-green-50 text-green-700 border-green-200',
  falto: 'bg-red-50 text-red-700 border-red-200',
}

export default function AdminVisitaDetailPage() {
  const { visitaId } = useParams<{ visitaId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const palId = searchParams.get('pal') || ''
  const fecha = searchParams.get('fecha') || ''

  const [visita, setVisita] = useState<Visita | null>(null)
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [fotos, setFotos] = useState<{ id: string; url_storage: string }[]>([])
  const [loadingVisita, setLoadingVisita] = useState(true)
  const [loadingActividades, setLoadingActividades] = useState(true)
  const [loadingFotos, setLoadingFotos] = useState(true)

  useEffect(() => {
    if (!visitaId) return
    visitasService.getVisitaById(visitaId)
      .then(setVisita)
      .catch(console.error)
      .finally(() => setLoadingVisita(false))
  }, [visitaId])

  useEffect(() => {
    if (!palId || !fecha || !visita?.institucion_id) return
    actividadesService.getActividadesByInstitucion(visita.institucion_id, palId)
      .then(data => {
        // filtrar por fecha
        const filtradas = data.filter(a => a.fecha_actividad === fecha)
        setActividades(filtradas)
      })
      .catch(console.error)
      .finally(() => setLoadingActividades(false))
  }, [palId, fecha, visita?.institucion_id])

  useEffect(() => {
    if (!visitaId) return
    fotosEvidenciaService.getFotosByVisita(visitaId)
      .then(setFotos)
      .catch(console.error)
      .finally(() => setLoadingFotos(false))
  }, [visitaId])

  // Puntos para el mapa
  const puntosMapa: [number, number][] = []
  if (visita?.institucion) {
    puntosMapa.push([visita.institucion.latitud, visita.institucion.longitud])
  }
  if (visita?.latitud_registro && visita?.longitud_registro) {
    puntosMapa.push([visita.latitud_registro, visita.longitud_registro])
  }

  if (loadingVisita) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No se encontró la visita
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Regresar
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Detalle de Visita</h1>
          <p className="text-sm text-muted-foreground">
            {fecha && format(new Date(fecha + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Badge variant="outline" className={cn('ml-auto', ESTADO_COLORS[visita.estado])}>
          {ESTADO_LABELS[visita.estado] || visita.estado}
        </Badge>
      </div>

      {/* Fila 1 — 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Col 1 — Institución y visita */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Institución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">{visita.institucion?.nombre || 'N/A'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{visita.institucion?.direccion}</p>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{format(new Date(visita.fecha_visita), "d 'de' MMMM yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{format(new Date(visita.fecha_visita), 'HH:mm')}</span>
              </div>
            </div>
            {visita.fecha_hora_registro && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-1">Registro de asistencia</p>
                <p className="text-sm">
                  {format(new Date(visita.fecha_hora_registro), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Col 2 — PAL y foto */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              PAL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">{visita.pal?.nombre_completo || 'N/A'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{visita.pal?.email}</p>
            </div>

            {/* Foto de evidencia */}
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Foto de evidencia
              </p>
              {loadingFotos ? (
                <div className="w-full aspect-square rounded bg-muted animate-pulse" />
              ) : fotos.length > 0 ? (
                <a href={fotos[0].url_storage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={fotos[0].url_storage}
                    alt="Evidencia"
                    className="w-full aspect-square object-cover rounded border hover:opacity-80 transition-opacity"
                  />
                </a>
              ) : (
                <div className="w-full aspect-square rounded bg-muted flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
              {fotos.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  +{fotos.length - 1} foto{fotos.length - 1 > 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Col 3 — Mapa + GPS (ocupa 2/4) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Ubicación y validación GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            {/* Mapa */}
            {visita.institucion && (
              <div className="relative" style={{ height: 220 }}>
                <MapContainer
                  center={[visita.institucion.latitud, visita.institucion.longitud]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  />
                  <FitBounds puntos={puntosMapa} />
                  <Marker
                    position={[visita.institucion.latitud, visita.institucion.longitud]}
                    icon={iconoHospital}
                  >
                    <Popup>{visita.institucion.nombre}</Popup>
                  </Marker>
                  {visita.latitud_registro && visita.longitud_registro && (
                    <Marker
                      position={[visita.latitud_registro, visita.longitud_registro]}
                      icon={iconoUsuario}
                    >
                      <Popup>Ubicación registrada</Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            )}

            {/* Datos GPS */}
            <div className="px-4 pb-4 pt-2 grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">GPS dispositivo</p>
                <Badge variant="outline" className={cn(
                  'text-xs',
                  visita.gps_dispositivo
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}>
                  {visita.gps_dispositivo ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Activo</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Inactivo</>
                  )}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Validación</p>
                <Badge variant="outline" className={cn(
                  'text-xs',
                  visita.validacion_gps
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}>
                  {visita.validacion_gps ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />En rango</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Fuera de rango</>
                  )}
                </Badge>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Distancia</p>
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                  {visita.distancia_metros != null ? `${visita.distancia_metros}m` : '—'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2 — Actividades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Actividades del día en {visita.institucion?.nombre}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActividades ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Cargando actividades...</span>
            </div>
          ) : actividades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividades registradas para este día en esta institución
            </p>
          ) : (
            <div className="divide-y">
              {actividades.map((actividad) => (
                <div key={actividad.id} className="py-3 flex items-start gap-3">
                  
                  {/* Hora */}
                  <div className="text-xs text-muted-foreground w-10 flex-shrink-0 pt-0.5">
                    {actividad.hora_actividad
                      ? actividad.hora_actividad.slice(0, 5)
                      : '—'}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actividad.tipo_actividad === 'presencial' ? 'default' : 'secondary'} className="text-xs">
                        {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                      </Badge>
                      {actividad.contacto && (
                        <span className="text-sm font-medium truncate">
                          {`${actividad.contacto.nombre} ${actividad.contacto.apellido_pat || ''}`.trim()}
                        </span>
                      )}
                      {actividad.contacto && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {actividad.contacto.tipo_contacto}
                        </span>
                      )}
                    </div>

                    {actividad.descripcion_actividad && (
                      <p className="text-sm text-muted-foreground truncate">
                        {actividad.descripcion_actividad}
                      </p>
                    )}

                    {(actividad.entrega_sobres || actividad.entrega_kit_rash) && (
                      <div className="flex gap-1.5 flex-wrap">
                        {actividad.entrega_sobres && (
                          <Badge variant="outline" className="text-xs">Entrega de sobres <b>{actividad.entrega_sobres.nombre}</b></Badge>
                        )}
                        {actividad.entrega_kit_rash && (
                          <Badge variant="outline" className="text-xs">Entrega de Kit Rash <b>{actividad.entrega_kit_rash.nombre}</b></Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}