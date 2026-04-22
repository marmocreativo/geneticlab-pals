import { useState, useEffect, useMemo } from 'react'
import {
  Users, Building2, Calendar, Activity,
  AlertTriangle, Database, Clock, Wifi
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useUsers } from '@/hooks/useUsers'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  eachWeekOfInterval, endOfWeek, parseISO, differenceInDays
} from 'date-fns'
import { es } from 'date-fns/locale'
import { visitasService } from '@/services/visitasService'
import { actividadesService } from '@/services/actividadesService'
import type { Visita } from '@/types/visita'
import type { Actividad } from '@/types/actividad'

export default function Dashboard() {
  const { users } = useUsers()

  const hoy = new Date()
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(hoy), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(hoy), 'yyyy-MM-dd'))
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<string | null>(null)

  // Cargar datos cuando cambia el rango
  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true)
        const [v, a] = await Promise.all([
          visitasService.getVisitasByRangoFechas(fechaInicio, fechaFin),
          actividadesService.getAllActividades(fechaInicio, fechaFin)
        ])
        setVisitas(v)
        setActividades(a)
        setLastFetch(localStorage.getItem('app_last_fetch'))
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [fechaInicio, fechaFin])

  // Determinar si agrupar por día o semana
  const diasRango = differenceInDays(parseISO(fechaFin), parseISO(fechaInicio))
  const agruparPorSemana = diasRango > 30

  // Datos para la gráfica
  const datosGrafica = useMemo(() => {
    if (!visitas.length) return []

    if (!agruparPorSemana) {
      // Agrupar por día
      const dias = eachDayOfInterval({ start: parseISO(fechaInicio), end: parseISO(fechaFin) })
      return dias.map(dia => {
        const label = format(dia, 'd MMM', { locale: es })
        const diaStr = format(dia, 'yyyy-MM-dd')
        const visitasDia = visitas.filter(v =>
          format(parseISO(v.fecha_visita), 'yyyy-MM-dd') === diaStr
        )
        return {
          label,
          Programadas: visitasDia.filter(v => v.estado === 'programada').length,
          Asistió: visitasDia.filter(v => v.estado === 'asistio').length,
          Faltó: visitasDia.filter(v => v.estado === 'falto').length
        }
      })
    } else {
      // Agrupar por semana
      const semanas = eachWeekOfInterval(
        { start: parseISO(fechaInicio), end: parseISO(fechaFin) },
        { weekStartsOn: 1 }
      )
      return semanas.map(inicioSemana => {
        const finSemana = endOfWeek(inicioSemana, { weekStartsOn: 1 })
        const label = `${format(inicioSemana, 'd MMM', { locale: es })} - ${format(finSemana, 'd MMM', { locale: es })}`
        const visitasSemana = visitas.filter(v => {
          const fecha = parseISO(v.fecha_visita)
          return fecha >= inicioSemana && fecha <= finSemana
        })
        return {
          label,
          Programadas: visitasSemana.filter(v => v.estado === 'programada').length,
          Asistió: visitasSemana.filter(v => v.estado === 'asistio').length,
          Faltó: visitasSemana.filter(v => v.estado === 'falto').length
        }
      })
    }
  }, [visitas, fechaInicio, fechaFin, agruparPorSemana])

  // Alertas — institución con más visitas fuera de rango GPS
  const alertaInstitucion = useMemo(() => {
    const fueraDeRango = visitas.filter(v => v.gps_dispositivo && !v.validacion_gps)
    const conteo: Record<string, { nombre: string; total: number }> = {}
    fueraDeRango.forEach(v => {
      const id = v.institucion_id
      const nombre = v.institucion?.nombre || id
      if (!conteo[id]) conteo[id] = { nombre, total: 0 }
      conteo[id].total++
    })
    const ordenado = Object.values(conteo).sort((a, b) => b.total - a.total)
    return ordenado[0] || null
  }, [visitas])

  // Alertas — PALs sin visitas ni actividades en el rango
  const palsInactivos = useMemo(() => {
    const pals = users.filter(u => u.role === 'pal' && u.activo)
    return pals.filter(pal => {
      const tieneVisitas = visitas.some(v => v.pal_id === pal.id)
      const tieneActividades = actividades.some(a => a.pal_id === pal.id)
      return !tieneVisitas && !tieneActividades
    })
  }, [users, visitas, actividades])

  // Fila 3 — Instituciones con más visitas
  const topInstituciones = useMemo(() => {
    const conteo: Record<string, { nombre: string; total: number }> = {}
    visitas.forEach(v => {
      const id = v.institucion_id
      const nombre = v.institucion?.nombre || id
      if (!conteo[id]) conteo[id] = { nombre, total: 0 }
      conteo[id].total++
    })
    return Object.values(conteo).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [visitas])

  // Fila 3 — PALs con más actividades
  const topPals = useMemo(() => {
    const conteo: Record<string, { nombre: string; total: number }> = {}
    actividades.forEach(a => {
      const id = a.pal_id
      const nombre = a.pal?.nombre_completo || id
      if (!conteo[id]) conteo[id] = { nombre, total: 0 }
      conteo[id].total++
    })
    return Object.values(conteo).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [actividades])

  // Stats fila 4
  const totalPals = users.filter(u => u.role === 'pal' && u.activo).length
  const visitasValidadas = visitas.filter(v => v.gps_dispositivo).length
  const tasaValidacion = visitas.length > 0
    ? Math.round((visitasValidadas / visitas.length) * 100)
    : 0

  return (
    <div className="space-y-6">

      {/* Header + filtro fechas */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {format(parseISO(fechaInicio), "d 'de' MMMM", { locale: es })} — {format(parseISO(fechaFin), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <Label className="text-xs">Desde</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-36 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Hasta</Label>
            <Input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-36 h-8 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFechaInicio(format(startOfMonth(hoy), 'yyyy-MM-dd'))
              setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'))
            }}
          >
            Este mes
          </Button>
        </div>
      </div>

      {/* Fila 1 — Gráfica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Visitas del período
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({agruparPorSemana ? 'agrupado por semana' : 'por día'})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : datosGrafica.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Sin datos en el período seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={datosGrafica} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval={agruparPorSemana ? 0 : 'preserveStartEnd'}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                
                <Bar dataKey="Faltó" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Asistió" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Programadas" stackId="a" fill="#1d71b8" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Fila 2 — Alertas */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Institución con más visitas fuera de rango */}
        <Card className={alertaInstitucion ? 'border-amber-200' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Institución con más visitas fuera de rango
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : alertaInstitucion ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{alertaInstitucion.nombre}</span>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {alertaInstitucion.total} visitas
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin alertas en el período</p>
            )}
          </CardContent>
        </Card>

        {/* PALs sin actividad */}
        <Card className={palsInactivos.length > 0 ? 'border-red-200' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              PALs sin visitas ni actividades en el período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 bg-muted animate-pulse rounded" />
            ) : palsInactivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos los PALs tienen actividad</p>
            ) : (
              <div className="space-y-1">
                {palsInactivos.slice(0, 3).map(pal => (
                  <div key={pal.id} className="flex items-center justify-between">
                    <span className="text-sm">{pal.nombre_completo}</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      Sin actividad
                    </Badge>
                  </div>
                ))}
                {palsInactivos.length > 3 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    +{palsInactivos.length - 3} más
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 3 — Rankings */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* Instituciones con más visitas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Instituciones con más visitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : topInstituciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topInstituciones.map((inst, i) => (
                  <div key={inst.nombre} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm truncate">{inst.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{inst.total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(inst.total / topInstituciones[0].total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PALs con más actividades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              PALs con más actividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : topPals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {topPals.map((pal, i) => (
                  <div key={pal.nombre} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm truncate">{pal.nombre}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{pal.total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(pal.total / topPals[0].total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 4 — Stats del sistema */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Base de datos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Conectada</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Supabase PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Última consulta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {lastFetch
                ? format(new Date(lastFetch), "HH:mm:ss", { locale: es })
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastFetch
                ? format(new Date(lastFetch), "d MMM yyyy", { locale: es })
                : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PALs activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.filter(u => u.role === 'pal').length} registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasa de validación GPS</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '—' : `${tasaValidacion}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {visitasValidadas} de {visitas.length} visitas
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}