import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, Building2, MapPin, Calendar,
  Users, Activity, Navigation, CheckCircle, XCircle
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { visitasService } from '@/services/visitasService'
import { actividadesService } from '@/services/actividadesService'
import type { Visita } from '@/types/visita'
import type { Actividad } from '@/types/actividad'
import { cn } from '@/lib/utils'
import { useEffect as useEffectInner } from 'react'

interface Institucion {
  id: string
  nombre: string
  direccion: string
  latitud: number
  longitud: number
  sector_id: string | null
  google_place_id: string | null
  created_at: string
  catalogos?: { nombre: string } | null
}

// Marcador de registro de visita con opacidad según densidad
const iconoRegistro = (opacity: number) => L.divIcon({
  className: '',
  html: `<div style="background:#e8308a;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:${opacity}"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const iconoHospital = L.divIcon({
  className: '',
  html: `<div style="background:#1d71b8;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function FitBounds({ puntos }: { puntos: [number, number][] }) {
  const map = useMap()
  useEffectInner(() => {
    if (puntos.length < 2) return
    map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] })
  }, [puntos, map])
  return null
}

export default function AdminInstitucionDetailPage() {
  const { institucionId } = useParams<{ institucionId: string }>()
  const navigate = useNavigate()

  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!institucionId) return
    const cargar = async () => {
      try {
        setLoading(true)
        const [{ data: instData }, visitasData, actividadesData] = await Promise.all([
          supabase
            .from('instituciones')
            .select('*, catalogos!sector_id(nombre)')
            .eq('id', institucionId)
            .single(),
          visitasService.getVisitasByRangoFechas('2000-01-01', '2099-12-31', undefined),
          actividadesService.getActividadesByInstitucion(institucionId)
        ])
        setInstitucion(instData)
        // Filtrar visitas de esta institución
        setVisitas((visitasData || []).filter((v: Visita) => v.institucion_id === institucionId))
        setActividades(actividadesData || [])
      } catch (error) {
        console.error('Error cargando institución:', error)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [institucionId])

  // PALs que más visitan
  const topPals = useMemo(() => {
    const conteo: Record<string, { nombre: string; total: number; validadas: number }> = {}
    visitas.forEach(v => {
      const id = v.pal_id
      const nombre = v.pal?.nombre_completo || id
      if (!conteo[id]) conteo[id] = { nombre, total: 0, validadas: 0 }
      conteo[id].total++
      if (v.gps_dispositivo) conteo[id].validadas++
    })
    return Object.values(conteo).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [visitas])

  // Puntos de registro para el mapa
  const puntosRegistro = useMemo(() => {
    return visitas
      .filter(v => v.latitud_registro && v.longitud_registro)
      .map(v => ({ lat: v.latitud_registro!, lng: v.longitud_registro! }))
  }, [visitas])

  // Calcular densidad para opacidad de marcadores
  const maxDensidad = useMemo(() => {
    if (!puntosRegistro.length) return 1
    // Agrupar puntos cercanos (aprox 20m)
    const grupos: { lat: number; lng: number; count: number }[] = []
    puntosRegistro.forEach(p => {
      const cercano = grupos.find(g =>
        Math.abs(g.lat - p.lat) < 0.0002 && Math.abs(g.lng - p.lng) < 0.0002
      )
      if (cercano) cercano.count++
      else grupos.push({ ...p, count: 1 })
    })
    return Math.max(...grupos.map(g => g.count))
  }, [puntosRegistro])

  // Puntos agrupados con densidad
  const puntosAgrupados = useMemo(() => {
    const grupos: { lat: number; lng: number; count: number }[] = []
    puntosRegistro.forEach(p => {
      const cercano = grupos.find(g =>
        Math.abs(g.lat - p.lat) < 0.0002 && Math.abs(g.lng - p.lng) < 0.0002
      )
      if (cercano) cercano.count++
      else grupos.push({ ...p, count: 1 })
    })
    return grupos
  }, [puntosRegistro])

  // Puntos para fitBounds
  const puntosMapa = useMemo((): [number, number][] => {
    if (!institucion) return []
    const pts: [number, number][] = [[institucion.latitud, institucion.longitud]]
    puntosAgrupados.forEach(p => pts.push([p.lat, p.lng]))
    return pts
  }, [institucion, puntosAgrupados])

  // Stats globales
  const stats = useMemo(() => {
    const visitasAsistio = visitas.filter(v => v.estado === 'asistio').length
    const visitasFalto = visitas.filter(v => v.estado === 'falto').length
    const visitasProgramadas = visitas.filter(v => v.estado === 'programada').length
    const visitasValidadas = visitas.filter(v => v.gps_dispositivo).length
    const visitasEnRango = visitas.filter(v => v.validacion_gps).length
    const palsUnicos = new Set(visitas.map(v => v.pal_id)).size
    const actividadesPresencial = actividades.filter(a => a.tipo_actividad === 'presencial').length
    const actividadesTelefono = actividades.filter(a => a.tipo_actividad === 'telefono').length

    return {
      totalVisitas: visitas.length,
      visitasAsistio,
      visitasFalto,
      visitasProgramadas,
      visitasValidadas,
      visitasEnRango,
      tasaAsistencia: visitas.length > 0 ? Math.round((visitasAsistio / visitas.length) * 100) : 0,
      tasaValidacion: visitas.length > 0 ? Math.round((visitasValidadas / visitas.length) * 100) : 0,
      palsUnicos,
      totalActividades: actividades.length,
      actividadesPresencial,
      actividadesTelefono,
    }
  }, [visitas, actividades])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!institucion) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Institución no encontrada
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
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">{institucion.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {institucion.direccion}
          </p>
        </div>
        <Badge variant="secondary">
          {(institucion.catalogos as any)?.nombre || 'Sin sector'}
        </Badge>
      </div>

      {/* Fila 1 — Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.totalVisitas}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Asistió</span>
                <span className="text-green-600 font-medium">{stats.visitasAsistio}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Faltó</span>
                <span className="text-red-500 font-medium">{stats.visitasFalto}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Programadas</span>
                <span className="text-yellow-600 font-medium">{stats.visitasProgramadas}</span>
              </div>
            </div>
            <div className="pt-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Asistencia</span>
                <span className="font-medium">{stats.tasaAsistencia}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.tasaAsistencia}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.tasaValidacion}%</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Con GPS</span>
                <span className="font-medium">{stats.visitasValidadas}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">En rango</span>
                <span className="text-green-600 font-medium">{stats.visitasEnRango}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fuera de rango</span>
                <span className="text-amber-600 font-medium">
                  {stats.visitasValidadas - stats.visitasEnRango}
                </span>
              </div>
            </div>
            <div className="pt-1">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${stats.tasaValidacion}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.totalActividades}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Presenciales</span>
                <span className="font-medium">{stats.actividadesPresencial}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Telefónicas</span>
                <span className="font-medium">{stats.actividadesTelefono}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              PALs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.palsUnicos}</div>
            <p className="text-xs text-muted-foreground">
              PALs distintos que han visitado esta institución
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2 — Mapa + PALs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Mapa — ocupa 2/3 */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Puntos de registro de visitas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: 320 }}>
              <MapContainer
                center={[institucion.latitud, institucion.longitud]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                />
                <FitBounds puntos={puntosMapa} />

                {/* Institución */}
                <Marker
                  position={[institucion.latitud, institucion.longitud]}
                  icon={iconoHospital}
                >
                  <Popup>{institucion.nombre}</Popup>
                </Marker>

                {/* Puntos de registro agrupados con densidad visual */}
                {puntosAgrupados.map((p, i) => {
                  const opacity = 0.3 + (p.count / maxDensidad) * 0.7
                  const size = 8 + Math.round((p.count / maxDensidad) * 14)
                  const icono = L.divIcon({
                    className: '',
                    html: `<div style="background:#e8308a;width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);opacity:${opacity}"></div>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                  })
                  return (
                    <Marker key={i} position={[p.lat, p.lng]} icon={icono}>
                      <Popup>{p.count} registro{p.count > 1 ? 's' : ''} en esta zona</Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                Institución
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent opacity-80" />
                Registros (más grande = más frecuente)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PALs que más visitan */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              PALs que más visitan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin visitas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {topPals.map((pal, i) => (
                  <div key={pal.nombre} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm truncate">{pal.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {pal.total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(pal.total / topPals[0].total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                        <span>{pal.validadas} con GPS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 3 — Visitas recientes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Últimas visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visitas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin visitas registradas
            </p>
          ) : (
            <div className="divide-y">
              {[...visitas]
                .sort((a, b) => new Date(b.fecha_visita).getTime() - new Date(a.fecha_visita).getTime())
                .slice(0, 8)
                .map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{v.pal?.nombre_completo || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(v.fecha_visita), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.gps_dispositivo && (
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          v.validacion_gps
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {v.validacion_gps
                            ? <><CheckCircle className="h-3 w-3 mr-1" />En rango</>
                            : <><XCircle className="h-3 w-3 mr-1" />Fuera de rango</>
                          }
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        v.estado === 'asistio' && 'bg-green-50 text-green-700 border-green-200',
                        v.estado === 'falto' && 'bg-red-50 text-red-700 border-red-200',
                        v.estado === 'programada' && 'bg-yellow-50 text-yellow-700 border-yellow-200',
                      )}>
                        {v.estado === 'asistio' ? 'Asistió' : v.estado === 'falto' ? 'Faltó' : 'Programada'}
                      </Badge>
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