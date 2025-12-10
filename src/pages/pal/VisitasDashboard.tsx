import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Phone, Plus, ArrowLeft, ArrowRight, AlertCircle, CalendarDays, CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVisitas } from '@/hooks/useVisitas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useAuth } from '@/contexts/AuthContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Visita, VisitaInsert } from '@/types/visita'

type ViewMode = 'dia' | 'semana' | 'mes'

export default function VisitasDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('dia')
  const [showNewVisitDialog, setShowNewVisitDialog] = useState(false)
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('')
  const [visitaFecha, setVisitaFecha] = useState<Date>(new Date())
  const [tipoVisita, setTipoVisita] = useState<'presencial' | 'telefono'>('presencial')
  
  const { visitas, loading, fetchVisitasByFecha, createVisita } = useVisitas()
  const { instituciones, fetchInstituciones } = useInstituciones()
  const timelineRef = useRef<HTMLDivElement>(null)

  // Cargar instituciones al inicio
  useEffect(() => {
    fetchInstituciones()
  }, [])

  // Cargar visitas del día seleccionado automáticamente
  useEffect(() => {
    const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd')
    console.log('🗓️ Cargando visitas para:', fechaSeleccionada)
    fetchVisitasByFecha(fechaSeleccionada)
  }, [selectedDate])

  // Navegación de días
  const irDiaAnterior = () => {
    setSelectedDate(prev => subDays(prev, 1))
  }

  const irDiaSiguiente = () => {
    setSelectedDate(prev => addDays(prev, 1))
  }

  const irHoy = () => {
    setSelectedDate(new Date())
  }

  // Cambiar modo de vista
  const toggleViewMode = () => {
    if (viewMode === 'dia') setViewMode('semana')
    else if (viewMode === 'semana') setViewMode('mes')
    else setViewMode('dia')
  }

  // Abrir formulario nueva visita
  const handleOpenNewVisit = () => {
    setVisitaFecha(selectedDate) // Inicializar con el día seleccionado
    setSelectedInstitucion('')
    setTipoVisita('presencial') // Reset a presencial por defecto
    setShowNewVisitDialog(true)
  }

  // Manejar creación de visita completa
  const handleCreateVisita = async () => {
    if (!selectedInstitucion || !user?.id) return

    const nuevaVisita: VisitaInsert = {
      pal_id: user.id,
      institucion_id: selectedInstitucion,
      fecha_visita: visitaFecha.toISOString(),
      tipo_visita: tipoVisita
    }

    await createVisita(nuevaVisita)
    setShowNewVisitDialog(false)
    setSelectedInstitucion('')
    
    // Refrescar visitas del día si es el mismo día
    const fechaVisita = format(visitaFecha, 'yyyy-MM-dd')
    const fechaSeleccionada = format(selectedDate, 'yyyy-MM-dd')
    if (fechaVisita === fechaSeleccionada) {
      await fetchVisitasByFecha(fechaSeleccionada)
    }
  }

  // Obtener días de la semana actual
  const getWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }) // Lunes
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }

  // Obtener días del mes actual
  const getMonthDays = () => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
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
    const sortedVisitas = visitas
      .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())
    
    // Buscar la primera visita que aún no ha pasado
    const proximaIndex = sortedVisitas.findIndex(visita => 
      new Date(visita.fecha_visita) > now
    )
    
    if (proximaIndex === -1) {
      // Si todas las visitas ya pasaron, mostrar la última
      return sortedVisitas.length - 1
    }
    
    return proximaIndex
  }

  // Scroll automático cuando cambien las visitas del día
  useEffect(() => {
    if (visitas.length > 0 && timelineRef.current && viewMode === 'dia') {
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
  }, [visitas, viewMode])

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
      {/* Barra de navegación */}
      <div className="space-y-4">
        {/* Navegación de días */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={irDiaAnterior}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold">
              {isHoy ? 'Hoy' : format(selectedDate, 'EEEE d', { locale: es })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          
          <Button variant="outline" size="sm" onClick={irDiaSiguiente}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón para cambiar vista y botón hoy */}
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={irHoy}>
            Hoy
          </Button>
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === 'dia' && <CalendarDays className="h-4 w-4 mr-1" />}
            {viewMode === 'semana' && <CalendarIcon className="h-4 w-4 mr-1" />}
            {viewMode === 'mes' && <Calendar className="h-4 w-4 mr-1" />}
            {viewMode === 'dia' ? 'Ver Semana' : viewMode === 'semana' ? 'Ver Mes' : 'Ver Día'}
          </Button>
        </div>

        {/* Vista de Semana */}
        {viewMode === 'semana' && (
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays().map(day => {
                  const isSelected = isSameDay(day, selectedDate)
                  const isTodayDay = isToday(day)
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-2 text-sm rounded-lg transition-colors min-h-[2.5rem] touch-manipulation",
                        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        isTodayDay && !isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : ''
                      )}
                    >
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'EEE', { locale: es })}
                      </div>
                      <div className="font-medium">
                        {format(day, 'd')}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista de Mes */}
        {viewMode === 'mes' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-center">
                {format(selectedDate, 'MMMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getMonthDays().map(day => {
                  const isSelected = isSameDay(day, selectedDate)
                  const isTodayDay = isToday(day)
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "p-1 text-xs rounded transition-colors min-h-[1.8rem] touch-manipulation",
                        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                        isTodayDay && !isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : ''
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botón Nueva Visita */}
      <Button onClick={handleOpenNewVisit} className="w-full" size="lg">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Visita
      </Button>

      {/* Timeline de visitas (solo en vista día) */}
      {viewMode === 'dia' && (
        <div className="space-y-4">
          {visitas.length === 0 ? (
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
                {visitas.length} visita{visitas.length !== 1 ? 's' : ''} programada{visitas.length !== 1 ? 's' : ''}
              </div>
              
              {/* Timeline con scroll */}
              <div 
                ref={timelineRef}
                className="relative max-h-[60vh] overflow-y-auto"
              >
                {/* Línea vertical del timeline */}
                <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                
                {visitas
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
      )}

      {/* Dialog Nueva Visita Completo */}
      <Dialog open={showNewVisitDialog} onOpenChange={setShowNewVisitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Nueva Visita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seleccionar Institución */}
            <div>
              <Label htmlFor="institucion" className="text-sm font-medium mb-2 block">
                Institución
              </Label>
              <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución..." />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map(institucion => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Visita */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Tipo de Visita
              </Label>
              <Select value={tipoVisita} onValueChange={(value: 'presencial' | 'telefono') => setTipoVisita(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Presencial
                    </div>
                  </SelectItem>
                  <SelectItem value="telefono">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      Telefónica
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seleccionar Fecha */}
            <div>
              <Label htmlFor="fecha" className="text-sm font-medium mb-2 block">
                Fecha
              </Label>
              <Input
                id="fecha"
                type="date"
                value={format(visitaFecha, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value)
                  newDate.setHours(visitaFecha.getHours(), visitaFecha.getMinutes())
                  setVisitaFecha(newDate)
                }}
                className="w-full"
              />
            </div>

            {/* Seleccionar Hora */}
            <div>
              <Label htmlFor="hora" className="text-sm font-medium mb-2 block">
                Hora
              </Label>
              <Input
                id="hora"
                type="time"
                value={format(visitaFecha, 'HH:mm')}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(':')
                  const newDate = new Date(visitaFecha)
                  newDate.setHours(parseInt(hours), parseInt(minutes))
                  setVisitaFecha(newDate)
                }}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowNewVisitDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateVisita}
                disabled={!selectedInstitucion}
                className="flex-1"
              >
                Programar Visita
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}