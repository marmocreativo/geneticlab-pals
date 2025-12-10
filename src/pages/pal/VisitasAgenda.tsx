// pages/pal/VisitasAgenda.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
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
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function VisitasAgenda() {
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const { visitas, loading, fetchVisitasByMes } = useVisitas()

  // Obtener rango del calendario
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })


  // Cargar datos cuando cambia el mes
  useEffect(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1 // getMonth() retorna 0-11, necesitamos 1-12
    fetchVisitasByMes(year, month)
    }, [currentMonth])

  // DEBUG: Log las visitas cada vez que cambian
  useEffect(() => {
    console.log('📋 VISITAS ACTUALES:', visitas)
    console.log('📋 CANTIDAD DE VISITAS:', visitas.length)
    if (visitas.length > 0) {
      console.log('📋 FECHAS DE VISITAS:')
      visitas.forEach((visita, index) => {
        console.log(`   ${index}: ${format(new Date(visita.fecha_visita), 'yyyy-MM-dd HH:mm')} - ${visita.institucion?.nombre}`)
      })
    }
  }, [visitas])

  // Obtener cantidad de visitas de un día específico
  const getVisitasDelDia = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd')
    const visitasDelDia = visitas.filter(visita => {
      const visitaDate = format(new Date(visita.fecha_visita), 'yyyy-MM-dd')
      return visitaDate === dayString
    })
    
    // DEBUG: Solo logear si hay visitas o si es día 9 (para test)
    if (visitasDelDia.length > 0 || dayString.endsWith('-09')) {
      console.log(`🗓️ DÍA ${dayString}:`, {
        visitasEncontradas: visitasDelDia.length,
        visitasDelDia: visitasDelDia.map(v => format(new Date(v.fecha_visita), 'yyyy-MM-dd HH:mm'))
      })
    }
    
    return visitasDelDia
  }

  // Navegar al mes anterior
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  // Navegar al mes siguiente
  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  // Ir al día actual
  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  // Navegar a la vista del día
  const handleDayClick = (day: Date) => {
    const fechaString = format(day, 'yyyy-MM-dd')
    navigate(`/pal/visitas-dia/${fechaString}`)
  }

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header con controles de navegación */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleToday}
            className="min-w-[120px] text-sm font-medium"
          >
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendario */}
      <Card className="p-4">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const visitasDelDia = getVisitasDelDia(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isCurrentDay = isToday(day)
            const hasVisitas = visitasDelDia.length > 0

            return (
              <Button
                key={day.toISOString()}
                variant="ghost"
                onClick={() => handleDayClick(day)}
                className={cn(
                  "h-16 w-full p-2 flex flex-col items-center justify-center relative",
                  "border border-transparent hover:border-border",
                  !isCurrentMonth && "text-muted-foreground opacity-50",
                  isCurrentDay && "bg-primary text-primary-foreground hover:bg-primary/90",
                  hasVisitas && isCurrentMonth && !isCurrentDay && "bg-blue-50 border-blue-200"
                )}
              >
                <span className="text-sm font-medium">
                  {format(day, 'd')}
                </span>
                
                {hasVisitas && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs h-5 min-w-[20px] px-1.5 mt-1",
                      isCurrentDay && "bg-primary-foreground text-primary"
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

      {/* Indicadores */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
          <span>Con visitas</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-muted-foreground">Cargando visitas...</span>
        </div>
      )}
    </div>
  )
}