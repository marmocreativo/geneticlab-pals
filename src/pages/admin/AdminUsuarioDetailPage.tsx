import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft, User, Mail, Phone, Calendar,
  Building2, Activity, MapPin
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { visitasService } from '@/services/visitasService'
import { actividadesService } from '@/services/actividadesService'
import type { Visita } from '@/types/visita'
import type { Actividad } from '@/types/actividad'
import { formatearTelefono } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useUsers } from '@/hooks/useUsers'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  role: string
  nombre_completo: string
  telefono: string | null
  activo: boolean
  created_at: string
}

export default function AdminUsuarioDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const { limpiarDatosPal } = useUsers()

  const handleLimpiar = async () => {
    if (!user) return
    if (!confirm(`¿Borrar TODOS los datos de ${user.nombre_completo}? Esta acción no se puede deshacer.`)) return
    const result = await limpiarDatosPal(userId!)
    if (result.success) {
      toast.success('Datos eliminados correctamente')
      // Recargar
      cargar()
    } else {
      toast.error(result.error || 'Error al limpiar datos')
    }
  }

  const cargar = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const [{ data: userData }, visitasData, actividadesData] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        visitasService.getVisitasByPal(userId),
        actividadesService.getActividadesByPal(userId)
      ])
      setUser(userData)
      setVisitas(visitasData)
      setActividades(actividadesData)
    } catch (error) {
      console.error('Error cargando usuario:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [userId])

  // Instituciones más visitadas
  const topInstituciones = useMemo(() => {
    const conteo: Record<string, { nombre: string; total: number; validadas: number }> = {}
    visitas.forEach(v => {
      const id = v.institucion_id
      const nombre = v.institucion?.nombre || id
      if (!conteo[id]) conteo[id] = { nombre, total: 0, validadas: 0 }
      conteo[id].total++
      if (v.validacion_gps) conteo[id].validadas++
    })
    return Object.values(conteo).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [visitas])

  // Stats globales
  const stats = useMemo(() => {
    const visitasAsistio = visitas.filter(v => v.estado === 'asistio').length
    const visitasFalto = visitas.filter(v => v.estado === 'falto').length
    const visitasProgramadas = visitas.filter(v => v.estado === 'programada').length
    const visitasValidadas = visitas.filter(v => v.validacion_gps).length

    const pacientesUnicos = new Set(
      actividades.filter(a => a.contacto_id).map(a => a.contacto_id)
    ).size

    const institucionesUnicas = new Set(visitas.map(v => v.institucion_id)).size

    const actividadesPresencial = actividades.filter(a => a.tipo_actividad === 'presencial').length
    const actividadesTelefono = actividades.filter(a => a.tipo_actividad === 'telefono').length

    return {
      totalVisitas: visitas.length,
      visitasAsistio,
      visitasFalto,
      visitasProgramadas,
      visitasValidadas,
      tasaAsistencia: visitas.length > 0 ? Math.round((visitasAsistio / visitas.length) * 100) : 0,
      tasaValidacion: visitas.length > 0 ? Math.round((visitasValidadas / visitas.length) * 100) : 0,
      totalActividades: actividades.length,
      actividadesPresencial,
      actividadesTelefono,
      pacientesUnicos,
      institucionesUnicas,
    }
  }, [visitas, actividades])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Usuario no encontrado
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
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{user.nombre_completo}</h1>
          <p className="text-sm text-muted-foreground">
            Miembro desde {format(parseISO(user.created_at), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
            {user.role === 'admin' ? 'Admin' : 'PAL'}
          </Badge>
          <Badge variant={user.activo ? 'default' : 'destructive'}>
            {user.activo ? 'Activo' : 'Inactivo'}
          </Badge>
          <Button variant="destructive" size="sm" onClick={handleLimpiar}>
            <Trash2 className="h-4 w-4 mr-1" />
            Limpiar datos
          </Button>
        </div>
      </div>

      {/* Fila 1 — Perfil + Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Datos del perfil */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            {user.telefono && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{formatearTelefono(user.telefono)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{format(parseISO(user.created_at), "d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instituciones</span>
                <span className="font-medium">{stats.institucionesUnicas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pacientes únicos</span>
                <span className="font-medium">{stats.pacientesUnicos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats visitas */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{stats.totalVisitas}</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Asistió</span>
                <span className="text-green-600 font-medium">{stats.visitasAsistio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Faltó</span>
                <span className="text-red-500 font-medium">{stats.visitasFalto}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Programadas</span>
                <span className="text-yellow-600 font-medium">{stats.visitasProgramadas}</span>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasa asistencia</span>
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

        {/* Stats actividades */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{stats.totalActividades}</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Presenciales</span>
                <span className="font-medium">{stats.actividadesPresencial}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Telefónicas</span>
                <span className="font-medium">{stats.actividadesTelefono}</span>
              </div>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pacientes únicos</span>
                <span className="font-medium">{stats.pacientesUnicos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats GPS */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Validación GPS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold">{stats.tasaValidacion}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.visitasValidadas} de {stats.totalVisitas} visitas con GPS registrado
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${stats.tasaValidacion}%` }}
              />
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">En rango</span>
                <span className="text-green-600 font-medium">
                  {visitas.filter(v => v.validacion_gps).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fuera de rango</span>
                <span className="text-amber-600 font-medium">
                  {visitas.filter(v => v.validacion_gps === false && v.latitud_registro != null).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fila 2 — Instituciones más visitadas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Instituciones más visitadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topInstituciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin visitas registradas
            </p>
          ) : (
            <div className="space-y-3">
              {topInstituciones.map((inst, i) => (
                <div key={inst.nombre} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{inst.nombre}</span>
                      <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {inst.validadas} GPS
                        </span>
                        <span className="text-xs font-medium">{inst.total} visitas</span>
                      </div>
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
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{v.institucion?.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(v.fecha_visita), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.latitud_registro != null && (
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          v.validacion_gps
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}>
                          {v.validacion_gps ? 'GPS válido' : 'Fuera de rango'}
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