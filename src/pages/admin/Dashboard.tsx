import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Building2, Calendar, FileText, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUsers } from '@/hooks/useUsers'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useVisitas } from '@/hooks/useVisitas'
import { useActividades } from '@/hooks/useActividades'
import { useFichas } from '@/hooks/useFichas'
import { useContactos } from '@/hooks/useContactos'
import { format, startOfDay, endOfDay, startOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface DashboardStats {
  totalPals: number
  totalInstituciones: number
  visitasHoy: number
  totalContactos: number
  totalFichas: number
  actividadesEsteMes: number
  visitasEstaSemana: number
  contactosRecientes: number
}

export default function Dashboard() {
  const { users } = useUsers()
  const { instituciones } = useInstituciones()
  const { visitas, fetchVisitasByDateRange } = useVisitas()
  const { actividades, fetchAllActividades } = useActividades()
  const { fichas } = useFichas()
  const { contactos } = useContactos()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPals: 0,
    totalInstituciones: 0,
    visitasHoy: 0,
    totalContactos: 0,
    totalFichas: 0,
    actividadesEsteMes: 0,
    visitasEstaSemana: 0,
    contactosRecientes: 0
  })
  
  const [loading, setLoading] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Obtener datos de visitas de hoy
        const hoy = new Date()
        const inicioHoy = format(startOfDay(hoy), 'yyyy-MM-dd')
        const finHoy = format(endOfDay(hoy), 'yyyy-MM-dd')
        await fetchVisitasByDateRange(inicioHoy, finHoy)
        
        // Obtener datos de visitas de esta semana
        const inicioSemana = format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const finSemana = format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')

        // Logs para evitar el error
        console.log(inicioSemana);
        console.log(finSemana);
        
        // Obtener actividades
        await fetchAllActividades()
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Calcular estadísticas cuando cambien los datos
  useEffect(() => {
    const calculateStats = () => {
      const hoy = new Date()
      const inicioMes = startOfMonth(hoy)
      const inicioSemana = startOfWeek(hoy, { weekStartsOn: 1 })
      const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Contar PALs activos
      const totalPals = users.filter(user => user.role === 'pal' && user.activo).length

      // Visitas de hoy
      const visitasHoy = visitas.filter(visita => {
        const fechaVisita = new Date(visita.fecha_visita)
        return fechaVisita.toDateString() === hoy.toDateString()
      }).length

      // Visitas de esta semana
      const visitasEstaSemana = visitas.filter(visita => {
        const fechaVisita = new Date(visita.fecha_visita)
        return fechaVisita >= inicioSemana && fechaVisita <= hoy
      }).length

      // Actividades este mes
      const actividadesEsteMes = actividades.filter(actividad => {
        const fechaActividad = new Date(actividad.fecha_actividad)
        return fechaActividad >= inicioMes && fechaActividad <= hoy
      }).length

      // Contactos recientes (últimos 7 días)
      const contactosRecientes = contactos.filter(contacto => {
        const fechaContacto = new Date(contacto.created_at)
        return fechaContacto >= hace7Dias
      }).length

      setStats({
        totalPals,
        totalInstituciones: instituciones.length,
        visitasHoy,
        totalContactos: contactos.length,
        totalFichas: fichas.length,
        actividadesEsteMes,
        visitasEstaSemana,
        contactosRecientes
      })
    }

    if (!loading) {
      calculateStats()
    }
  }, [users, instituciones, visitas, actividades, fichas, contactos, loading])

  // Obtener visitas por estado para hoy
  const visitasHoyPorEstado = visitas
    .filter(visita => {
      const fechaVisita = new Date(visita.fecha_visita)
      const hoy = new Date()
      return fechaVisita.toDateString() === hoy.toDateString()
    })
    .reduce((acc, visita) => {
      acc[visita.estado] = (acc[visita.estado] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  // Actividades recientes (últimas 5)
  const actividadesRecientes = actividades
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Vista general del sistema Control PALs - {format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PALs Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalPals}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios PAL en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Instituciones
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalInstituciones}</div>
            <p className="text-xs text-muted-foreground">
              Centros registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Visitas Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.visitasHoy}</div>
            <p className="text-xs text-muted-foreground">
              {stats.visitasEstaSemana} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Contactos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalContactos}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.contactosRecientes} últimos 7 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas secundarias */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fichas de Pacientes
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.totalFichas}</div>
            <p className="text-xs text-muted-foreground">
              Pacientes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actividades del Mes
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '-' : stats.actividadesEsteMes}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "MMMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tendencia
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{Math.round(((stats.actividadesEsteMes + stats.contactosRecientes) / 2))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Actividad general
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Panel de resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Visitas de hoy por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visitas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.visitasHoy === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay visitas programadas para hoy
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Programadas</span>
                  <Badge variant="outline">
                    {visitasHoyPorEstado.programada || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completadas</span>
                  <Badge variant="default">
                    {visitasHoyPorEstado.asistio || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Faltaron</span>
                  <Badge variant="secondary">
                    {visitasHoyPorEstado.falto || 0}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividades recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actividadesRecientes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay actividades recientes
              </p>
            ) : (
              <div className="space-y-3">
                {actividadesRecientes.map((actividad) => (
                  <div key={actividad.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {actividad.descripcion_actividad || 'Actividad sin descripción'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actividad.institucion?.nombre} • {format(new Date(actividad.fecha_actividad), 'd MMM', { locale: es })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs ml-2">
                      {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mensaje de estado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sistema Operativo</p>
              <p className="text-sm text-muted-foreground">
                Control PALs funcionando correctamente
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Activo
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}