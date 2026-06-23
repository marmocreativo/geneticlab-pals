import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useVisitas } from '@/hooks/useVisitas'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type Vista = 'mensual' | 'semanal'

const VISTA_KEY = 'agenda_vista_preferida'

export default function VisitasAgenda() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [vista, setVista] = useState<Vista>(() => {
    return (localStorage.getItem(VISTA_KEY) as Vista) ?? 'mensual'
  })
  const { visitas, loading, fetchVisitasByMes } = useVisitas()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = vista === 'mensual'
    ? eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    : eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    fetchVisitasByMes(year, month)
  }, [currentDate])

  const handleVistaChange = (v: Vista) => {
    setVista(v)
    localStorage.setItem(VISTA_KEY, v)
  }

  const handlePrev = () => {
    setCurrentDate(prev =>
      vista === 'mensual' ? subMonths(prev, 1) : subWeeks(prev, 1)
    )
  }

  const handleNext = () => {
    setCurrentDate(prev =>
      vista === 'mensual' ? addMonths(prev, 1) : addWeeks(prev, 1)
    )
  }

  const handleToday = () => setCurrentDate(new Date())

  const getVisitasDelDia = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd')
    return visitas.filter(v => format(new Date(v.fecha_visita), 'yyyy-MM-dd') === dayString)
  }

  const estadoBadgeVariant = (estado: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (estado === 'asistio') return 'default'
    if (estado === 'falto') return 'destructive'
    return 'secondary'
  }

  const labelNavegacion = vista === 'mensual'
    ? format(currentDate, 'MMMM yyyy', { locale: es })
    : `${format(weekStart, 'd MMM', { locale: es })} - ${format(weekEnd, 'd MMM yyyy', { locale: es })}`

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>
        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={vista === 'mensual' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleVistaChange('mensual')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={vista === 'semanal' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-2"
            onClick={() => handleVistaChange('semanal')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={handleToday} className="text-sm font-medium capitalize">
          {labelNavegacion}
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Vista Mensual */}
      {vista === 'mensual' && (
        <Card className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map(dia => (
              <div key={dia} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {dia}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const visitasDelDia = getVisitasDelDia(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const hasVisitas = visitasDelDia.length > 0

              return (
                <Button
                  key={day.toISOString()}
                  variant="ghost"
                  onClick={() => navigate(`/pal/visitas-dia/${format(day, 'yyyy-MM-dd')}`)}
                  className={cn(
                    'h-16 w-full p-2 flex flex-col items-center justify-center',
                    'border border-transparent hover:border-border',
                    !isCurrentMonth && 'text-muted-foreground opacity-50',
                    isCurrentDay && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    hasVisitas && isCurrentMonth && !isCurrentDay && 'bg-blue-50 border-blue-200'
                  )}
                >
                  <span className="text-sm font-medium">{format(day, 'd')}</span>
                  {hasVisitas && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs h-5 min-w-[20px] px-1.5 mt-1',
                        isCurrentDay && 'bg-primary-foreground text-primary'
                      )}
                    >
                      {visitasDelDia.length}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Vista Semanal — scroll horizontal con touch */}
      {vista === 'semanal' && (
        <div
          className="overflow-x-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="min-w-[1200px] w-full">
            {/* Cabecera días */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {calendarDays.map(day => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'text-center p-2 rounded-md',
                    isToday(day) && 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className={cn(
                    'text-xs font-medium',
                    isToday(day) ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                    {format(day, 'EEE', { locale: es }).toUpperCase()}
                  </p>
                  <p className={cn(
                    'text-sm font-bold',
                    isToday(day) && 'text-primary-foreground'
                  )}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>

            {/* Columnas de visitas */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const visitasDelDia = getVisitasDelDia(day)
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[360px] rounded-md border p-2 space-y-2 flex flex-col',
                        isToday(day) && 'border-primary/30 bg-primary/5'
                      )}
                    >
                      <div className="flex-1 space-y-2">
                        {visitasDelDia.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center pt-4">—</p>
                        ) : (
                          visitasDelDia.map(visita => (
                            <button
                              key={visita.id}
                              onClick={() => navigate(`/pal/visitas/${visita.id}`)}
                              className={cn(
                                'w-full text-left rounded p-3 text-xs leading-snug',
                                'border hover:shadow-sm transition-shadow',
                                visita.estado === 'asistio' && 'bg-green-50 border-green-200',
                                visita.estado === 'falto' && 'bg-red-50 border-red-200',
                                visita.estado === 'programada' && 'bg-blue-50 border-blue-200',
                              )}
                            >
                              <p className="font-medium truncate">{visita.institucion?.nombre ?? 'Home office'}</p>
                              <p className="text-muted-foreground text-[11px] mt-0.5">
                                {format(new Date(visita.fecha_visita), 'HH:mm')}
                              </p>
                              <Badge
                                variant={estadoBadgeVariant(visita.estado)}
                                className="text-[9px] px-1 py-0 h-4 mt-1"
                              >
                                {visita.estado}
                              </Badge>
                            </button>
                          ))
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/pal/visitas-dia/${format(day, 'yyyy-MM-dd')}`)}
                        className="w-full text-xs text-muted-foreground border border-dashed rounded p-1 hover:text-primary hover:border-primary transition-colors"
                      >
                        Ver / Agendar
                      </button>
                    </div>
                  )
                })}
              </div>
          </div>
        </div>
      )}

      {/* Indicadores */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Hoy</span>
        </div>
        {vista === 'mensual' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
            <span>Con visitas</span>
          </div>
        )}
        {vista === 'semanal' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
              <span>Programada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
              <span>Asistió</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
              <span>Faltó</span>
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
        </div>
      )}
    </div>
  )
}