import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, MapPin, User, Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { visitasService } from '@/services/visitasService'
import { actividadesService } from '@/services/actividadesService'
import { fotosEvidenciaService } from '@/services/fotosEvidenciaService'
import type { Visita } from '@/types/visita'
import type { Actividad } from '@/types/actividad'

const ESTADO_LABELS: Record<string, string> = {
  programada: 'Programada',
  asistio: 'Asistió',
  falto: 'Faltó',
}

const ESTADO_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  programada: 'secondary',
  asistio: 'default',
  falto: 'destructive',
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
    const fetchVisita = async () => {
      try {
        const data = await visitasService.getVisitaById(visitaId)
        setVisita(data)
      } catch (err) {
        console.error('Error cargando visita:', err)
      } finally {
        setLoadingVisita(false)
      }
    }
    fetchVisita()
  }, [visitaId])

  useEffect(() => {
    if (!palId || !fecha) return
    const fetchActividades = async () => {
      try {
        const data = await actividadesService.getActividadesByPal(palId, fecha, fecha)
        setActividades(data)
      } catch (err) {
        console.error('Error cargando actividades:', err)
      } finally {
        setLoadingActividades(false)
      }
    }
    fetchActividades()
  }, [palId, fecha])

  useEffect(() => {
    if (!visitaId) return
    const fetchFotos = async () => {
      try {
        const data = await fotosEvidenciaService.getFotosByVisita(visitaId)
        setFotos(data)
      } catch (err) {
        console.error('Error cargando fotos:', err)
      } finally {
        setLoadingFotos(false)
      }
    }
    fetchFotos()
  }, [visitaId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Regresar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de Visita</h1>
          <p className="text-sm text-muted-foreground">
            {fecha && format(new Date(fecha + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* Datos de la visita */}
      {loadingVisita ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Cargando visita...</span>
          </CardContent>
        </Card>
      ) : visita ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Información de la Visita</span>
              <Badge variant={ESTADO_VARIANTS[visita.estado] || 'secondary'}>
                {ESTADO_LABELS[visita.estado] || visita.estado}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Institución
              </p>
              <p className="font-medium">{visita.institucion?.nombre || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{visita.institucion?.direccion}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-4 w-4" />
                PAL
              </p>
              <p className="font-medium">{visita.pal?.nombre_completo || 'N/A'}</p>
              <p className="text-sm text-muted-foreground">{visita.pal?.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha y Hora
              </p>
              <p className="font-medium">
                {format(new Date(visita.fecha_visita), "d 'de' MMMM yyyy", { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(visita.fecha_visita), 'HH:mm')}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Validación GPS
              </p>
              {visita.validacion_gps ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Validada</span>
                  {visita.distancia_metros != null && (
                    <span className="text-sm text-muted-foreground ml-1">
                      ({visita.distancia_metros}m)
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">No validada</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground text-sm">
            No se encontró la visita
          </CardContent>
        </Card>
      )}

      {/* Fotos de evidencia */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos de Evidencia</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFotos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Cargando fotos...</span>
            </div>
          ) : fotos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay fotos de evidencia para esta visita
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {fotos.map((foto) => (
                <a key={foto.id} href={foto.url_storage} target="_blank" rel="noopener noreferrer">
                  <img
                    src={foto.url_storage}
                    alt="Evidencia"
                    className="w-full aspect-square object-cover rounded-md border hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actividades del día */}
      <Card>
        <CardHeader>
          <CardTitle>Actividades del Día</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActividades ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Cargando actividades...</span>
            </div>
          ) : actividades.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay actividades registradas para este día
            </p>
          ) : (
            <div className="space-y-3">
              {actividades.map((actividad) => (
                <div key={actividad.id} className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Badge variant={actividad.tipo_actividad === 'presencial' ? 'default' : 'secondary'}>
                      {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                    </Badge>
                    {actividad.hora_actividad && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {actividad.hora_actividad.slice(0, 5)}
                      </span>
                    )}
                  </div>

                  {actividad.contacto && (
                    <div>
                      <p className="text-xs text-muted-foreground">Contacto</p>
                      <p className="text-sm font-medium">
                        {`${actividad.contacto.nombre} ${actividad.contacto.apellido_pat || ''}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">{actividad.contacto.tipo_contacto}</p>
                    </div>
                  )}

                  {actividad.descripcion_actividad && (
                    <div>
                      <p className="text-xs text-muted-foreground">Descripción</p>
                      <p className="text-sm">{actividad.descripcion_actividad}</p>
                    </div>
                  )}

                  {actividad.temas_impartidos && (
                    <div>
                      <p className="text-xs text-muted-foreground">Temas Impartidos</p>
                      <p className="text-sm">{actividad.temas_impartidos}</p>
                    </div>
                  )}

                  {(actividad.entrega_sobres || actividad.entrega_kit_rash) && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Entregas</p>
                      <div className="flex gap-2 flex-wrap">
                        {actividad.entrega_sobres && (
                          <Badge variant="outline" className="text-xs">
                            {actividad.entrega_sobres.nombre}
                          </Badge>
                        )}
                        {actividad.entrega_kit_rash && (
                          <Badge variant="outline" className="text-xs">
                            {actividad.entrega_kit_rash.nombre}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {actividad.notas && (
                    <div>
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="text-sm text-muted-foreground italic">{actividad.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}