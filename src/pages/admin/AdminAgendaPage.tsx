// pages/admin/AdminAgendaPage.tsx
import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, Eye, MapPin, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useVisitas } from '@/hooks/useVisitas'
import type { Visita } from '@/types/visita'

export default function AdminAgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [visitasDelDia, setVisitasDelDia] = useState<Visita[]>([])
  const [showDayDetail, setShowDayDetail] = useState(false)

  const { visitas, loading, fetchVisitasByMes } = useVisitas()

  // Obtener días del mes actual
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Cargar visitas del mes cuando cambie el mes
  useEffect(() => {
    fetchVisitasByMes(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
  }, [currentMonth, fetchVisitasByMes])

  // Obtener visitas de un día específico
  const getVisitasDelDia = (day: Date): Visita[] => {
    if (!visitas) return []
    
    return visitas.filter(visita => {
      const visitaDate = new Date(visita.fecha_visita)
      return isSameDay(visitaDate, day)
    })
  }

  // Contar visitas por estado para un día
  const getEstadisticasDia = (day: Date) => {
    const visitasDia = getVisitasDelDia(day)
    return {
      total: visitasDia.length,
      programadas: visitasDia.filter(v => v.estado === 'programada').length,
      asistio: visitasDia.filter(v => v.estado === 'asistio').length,
      falto: visitasDia.filter(v => v.estado === 'falto').length
    }
  }

  const handleDayClick = (day: Date) => {
    const visitasDia = getVisitasDelDia(day)
    if (visitasDia.length > 0) {
      setSelectedDay(day)
      setVisitasDelDia(visitasDia)
      setShowDayDetail(true)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'asistio':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'falto':
        return <XCircle className="w-3 h-3 text-red-500" />
      case 'programada':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants = {
      'asistio': 'default',
      'falto': 'destructive', 
      'programada': 'secondary'
    } as const

    const labels = {
      'asistio': 'Asistió',
      'falto': 'Faltó',
      'programada': 'Programada'
    }

    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'secondary'} className="text-xs">
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario de Visitas</h1>
        <p className="text-muted-foreground">
          Vista mensual de todas las visitas programadas y realizadas
        </p>
      </div>

      {/* Header del calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                disabled={loading}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="bg-muted p-3 text-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-px bg-muted">
            {monthDays.map((day) => {
              const stats = getEstadisticasDia(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isCurrentDay = isToday(day)
              const hasVisitas = stats.total > 0

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "bg-background min-h-[120px] p-2 transition-colors",
                    isCurrentMonth ? "opacity-100" : "opacity-40",
                    hasVisitas ? "cursor-pointer hover:bg-muted/50" : "",
                    isCurrentDay ? "ring-2 ring-primary" : ""
                  )}
                >
                  {/* Número del día */}
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    isCurrentDay ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Estadísticas del día */}
                  {hasVisitas && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-center bg-primary/10 rounded px-1 py-0.5">
                        {stats.total} visita{stats.total !== 1 ? 's' : ''}
                      </div>
                      
                      {/* Indicadores por estado */}
                      <div className="space-y-1">
                        {stats.programadas > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span>{stats.programadas}</span>
                          </div>
                        )}
                        {stats.asistio > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>{stats.asistio}</span>
                          </div>
                        )}
                        {stats.falto > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span>{stats.falto}</span>
                          </div>
                        )}
                      </div>

                      {/* Icono de ver más */}
                      <div className="flex justify-center mt-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Programada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Asistió</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Faltó</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle del día */}
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Visitas del {selectedDay && format(selectedDay, "dd 'de' MMMM, yyyy", { locale: es })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {visitasDelDia.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>PAL</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>GPS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitasDelDia
                    .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())
                    .map((visita) => (
                    <TableRow key={visita.id}>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(visita.fecha_visita), "HH:mm")}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{visita.pal?.nombre_completo || 'N/A'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{visita.institucion?.nombre || 'N/A'}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(visita.estado)}
                          {getEstadoBadge(visita.estado)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {visita.validacion_gps ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            {visita.validacion_gps ? 'Validado' : 'Sin validar'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}