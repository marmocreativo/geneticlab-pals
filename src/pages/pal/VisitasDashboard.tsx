import { useState, useEffect, useRef  } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Phone, Plus, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useVisitas } from '@/hooks/useVisitas'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Visita, VisitaInsert } from '@/types/visita'
import VisitaForm from '@/components/visitas/VisitaForm'

export default function VisitasDashboard() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [showVisitaForm, setShowVisitaForm] = useState(false)
  const { visitas, loading, fetchVisitas, fetchVisitasByFecha, createVisita } = useVisitas()
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Separar las dos listas
  const [todasLasVisitas, setTodasLasVisitas] = useState<Visita[]>([]) // Para el calendario
  const [visitasDelDia, setVisitasDelDia] = useState<Visita[]>([]) // Para la lista del día

  // Obtener días del mes actual para el calendario
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Cargar visitas del día seleccionado
  useEffect(() => {
    const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd')
    console.log('🗓️ Cambió selectedDate a:', fechaSeleccionada)
    fetchVisitasByFecha(fechaSeleccionada)
  }, [selectedDate])

  // Actualizar visitasDelDia cuando cambien las visitas
  useEffect(() => {
    console.log('📊 Actualizando visitasDelDia con', visitas.length, 'visitas')
    setVisitasDelDia(visitas)
  }, [visitas])

  // Función para obtener visitas de un día específico (para el calendario)
  const getDayVisitas = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd')
    return todasLasVisitas.filter(visita => 
      format(new Date(visita.fecha_visita), 'yyyy-MM-dd') === dayString
    )
  }

  const handleCreateVisita = async (visitaData: VisitaInsert) => {
    await createVisita(visitaData)
    // Refrescar visitas del día si la nueva visita es del día seleccionado
    const visitaDate = format(new Date(visitaData.fecha_visita), 'yyyy-MM-dd')
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd')
    if (visitaDate === selectedDateString) {
      await fetchVisitasByFecha(selectedDateString)
    }
  }

  const handleSelectDate = (fecha: Date) => {
    console.log('🎯 handleSelectDate llamado con:', format(fecha, 'yyyy-MM-dd'))
    setSelectedDate(fecha)
    setShowCalendar(false)
  }

  const handleShowCalendar = async () => {
    console.log('🗓️ Cargando todas las visitas para el calendario')
    // Cargar todas las visitas para el calendario
    await fetchVisitas()
    setTodasLasVisitas(visitas)
    setCurrentMonth(selectedDate)
    setShowCalendar(true)
  }

  const handleProgramarVisita = () => {
    setShowVisitaForm(true)
  }

  // Función para determinar el estado visual de la visita
  const getVisitaState = (visita: Visita) => {
    const fechaVisita = new Date(visita.fecha_visita)
    const esPasado = isPast(fechaVisita)
    
    return {
      esPasado,
      estado: visita.estado,
      requiereAtencion: esPasado && visita.estado === 'programada'
    }
  }

  const getEstadoBadge = (visita: Visita) => {
    const { esPasado, estado, requiereAtencion } = getVisitaState(visita)
    
    if (requiereAtencion) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      )
    }
    
    const baseClasses = esPasado && estado !== 'programada' ? 'opacity-60' : ''
    
    switch (estado) {
      case 'programada':
        return <Badge variant="outline" className={cn("bg-blue-50 text-blue-700 border-blue-200", baseClasses)}>Programada</Badge>
      case 'asistio':
        return <Badge variant="outline" className={cn("bg-green-50 text-green-700 border-green-200", baseClasses)}>Asistió</Badge>
      case 'falto':
        return <Badge variant="outline" className={cn("bg-red-50 text-red-700 border-red-200", baseClasses)}>Faltó</Badge>
      default:
        return <Badge variant="outline" className={baseClasses}>{estado}</Badge>
    }
  }

  // Función para encontrar la próxima visita a realizar
  const findCurrentVisitaIndex = () => {
    const now = new Date()
    const sortedVisitas = visitasDelDia
      .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())
    
    // Buscar la primera visita que aún no ha pasado
    const proximaIndex = sortedVisitas.findIndex(visita => 
      new Date(visita.fecha_visita) > now
    )
    
    if (proximaIndex === -1) {
      // Si todas las visitas ya pasaron, mostrar la última
      return sortedVisitas.length - 1
    }
    
    // Devolver directamente la próxima visita
    return proximaIndex
  }

  // Scroll automático cuando cambien las visitas del día
  useEffect(() => {
    if (visitasDelDia.length > 0 && timelineRef.current && !showCalendar) {
      const currentIndex = findCurrentVisitaIndex()
      const timelineContainer = timelineRef.current
      const visitaElements = timelineContainer.querySelectorAll('[data-visita-index]')
      
      if (visitaElements[currentIndex]) {
        setTimeout(() => {
          visitaElements[currentIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }, 100)
      }
    }
  }, [visitasDelDia, showCalendar])

  const getTipoVisitaIcon = (tipo: string) => {
    return tipo === 'presencial' ? (
      <MapPin className="h-4 w-4 text-blue-600" />
    ) : (
      <Phone className="h-4 w-4 text-green-600" />
    )
  }

  const isHoy = isSameDay(selectedDate, new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando visitas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {showCalendar ? (
        // Vista de Calendario
        <>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalendar(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a lista
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const dayVisitas = getDayVisitas(day)
                  const isSelected = isSameDay(day, selectedDate)
                  const isTodayDay = isToday(day)
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleSelectDate(day)}
                      className={`
                        relative p-2 text-sm rounded-lg transition-colors min-h-[2.5rem] touch-manipulation
                        ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground' : ''}
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                        ${isTodayDay && !isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : ''}
                      `}
                    >
                      {format(day, 'd')}
                      {dayVisitas.length > 0 && (
                        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-primary-foreground' : 'bg-primary'
                          }`} />
                          {dayVisitas.length > 1 && (
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-primary-foreground' : 'bg-primary'
                            }`} />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        // Vista de Lista - Timeline
        <>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {isHoy ? 'Hoy' : format(selectedDate, 'EEEE d', { locale: es })}
              </h1>
              <p className="text-muted-foreground">
                {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowCalendar}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Cambiar día
              </Button>
            </div>
          </div>

          <Button onClick={handleProgramarVisita} className="w-full" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Visita para {isHoy ? 'Hoy' : format(selectedDate, 'dd/MM', { locale: es })}
          </Button>

          {/* Timeline de visitas */}
          <div className="space-y-4">
            {visitasDelDia.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-muted-foreground mb-2">
                    No hay visitas programadas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isHoy ? 'No tienes visitas programadas para hoy' : `No tienes visitas para ${format(selectedDate, 'dd/MM', { locale: es })}`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  {visitasDelDia.length} visita{visitasDelDia.length !== 1 ? 's' : ''} programada{visitasDelDia.length !== 1 ? 's' : ''}
                </div>
                
                {/* Timeline con scroll */}
                <div 
                  ref={timelineRef}
                  className="relative max-h-[60vh] overflow-y-auto"
                >
                  {/* Línea vertical del timeline */}
                  <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  {visitasDelDia
                    .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())
                    .map((visita, index) => {
                      const { esPasado, requiereAtencion } = getVisitaState(visita)
                      
                      return (
                        <div 
                          key={visita.id} 
                          data-visita-index={index}
                          className="relative flex items-start gap-2 sm:gap-4 pb-4 sm:pb-6"
                        >
                          {/* Punto del timeline */}
                          <div className={cn(
                            "relative z-10 flex h-2.5 w-2.5 sm:h-3 sm:w-3 items-center justify-center rounded-full border-2 bg-background mt-2",
                            requiereAtencion ? "border-red-500" : 
                            esPasado ? "border-muted-foreground/50" : "border-primary"
                          )}>
                            <div className={cn(
                              "h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full",
                              requiereAtencion ? "bg-red-500" :
                              esPasado ? "bg-muted-foreground/50" : "bg-primary"
                            )} />
                          </div>
                          
                          {/* Card de la visita */}
                          <Card
                            className={cn(
                              "flex-1 cursor-pointer transition-all hover:shadow-md touch-manipulation",
                              esPasado && !requiereAtencion ? "opacity-75" : "",
                              requiereAtencion ? "border-red-200 bg-red-50/50" : "hover:bg-muted/50"
                            )}
                            onClick={() => navigate(`/pal/visitas/${visita.id}`)}
                          >
                            <CardContent className="p-3 sm:p-4">
                              {/* Header con hora y tipo */}
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                  <div className="text-lg sm:text-sm font-mono font-bold sm:font-normal text-primary sm:text-muted-foreground">
                                    {format(new Date(visita.fecha_visita), 'HH:mm')}
                                  </div>
                                  {getTipoVisitaIcon(visita.tipo_visita)}
                                  <div className="sm:hidden">
                                    {getEstadoBadge(visita)}
                                  </div>
                                </div>
                                <div className="hidden sm:block">
                                  {getEstadoBadge(visita)}
                                </div>
                              </div>
                              
                              {/* Información de la institución */}
                              <div className="space-y-1 min-w-0">
                                <h3 className={cn(
                                  "font-medium text-sm sm:text-base truncate",
                                  esPasado && !requiereAtencion ? "text-muted-foreground" : ""
                                )}>
                                  {visita.institucion?.nombre}
                                </h3>
                                <p className={cn(
                                  "text-xs sm:text-sm text-muted-foreground line-clamp-1 break-all max-w-[200px] sm:max-w-none",
                                  esPasado && !requiereAtencion ? "text-muted-foreground/70" : ""
                                )}>
                                  {visita.institucion?.direccion && visita.institucion.direccion.length > 50 
                                    ? `${visita.institucion.direccion.substring(0, 50)}...` 
                                    : visita.institucion?.direccion}
                                </p>
                              </div>
                              
                              {/* GPS Badge */}
                              {visita.tipo_visita === 'presencial' && (
                                <div className="flex justify-start mt-2">
                                  {visita.validacion_gps ? (
                                    <Badge variant="outline" className={cn(
                                      "bg-green-50 text-green-700 border-green-200 text-xs",
                                      esPasado && !requiereAtencion ? "opacity-60" : ""
                                    )}>
                                      GPS Validado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className={cn(
                                      "bg-yellow-50 text-yellow-700 border-yellow-200 text-xs",
                                      esPasado && !requiereAtencion ? "opacity-60" : ""
                                    )}>
                                      Pendiente GPS
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <VisitaForm
        open={showVisitaForm}
        onOpenChange={setShowVisitaForm}
        onSubmit={handleCreateVisita}
        selectedDate={selectedDate}
      />
    </div>
  )
}