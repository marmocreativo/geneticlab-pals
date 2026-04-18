// pages/pal/VisitasDia.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft,  Calendar, AlertCircle, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useVisitas } from '@/hooks/useVisitas'
import { format, parseISO, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Visita } from '@/types/visita'
import VisitaForm from '@/components/visitas/VisitaForm'

export default function VisitasDia() {
  const { fecha } = useParams<{ fecha: string }>()
  const navigate = useNavigate()
  const { visitas, loading, fetchVisitasByFecha } = useVisitas()
  const [visitasDelDia, setVisitasDelDia] = useState<Visita[]>([])
  const [showVisitaForm, setShowVisitaForm] = useState(false)

  // Parsear la fecha del parámetro
  const fechaSeleccionada = fecha ? parseISO(fecha) : new Date()

  useEffect(() => {
    if (fecha) {
      fetchVisitasByFecha(fecha)
    }
  }, [fecha, fetchVisitasByFecha])

  useEffect(() => {
    setVisitasDelDia(visitas)
  }, [visitas])

  useEffect(() => {
    const handleFocus = () => {
      if (fecha) {
        fetchVisitasByFecha(fecha)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fecha, fetchVisitasByFecha])

  const handleVolverCalendario = () => {
    navigate('/pal/calendario')
  }

  const handleVisitaClick = (visitaId: string) => {
    navigate(`/pal/visitas/${visitaId}`, { 
      state: { selectedDate: fechaSeleccionada } 
    })
  }

  const handleVisitaCreated = () => {
    setShowVisitaForm(false)
    // Recargar visitas del día
    if (fecha) {
      fetchVisitasByFecha(fecha)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Programada</Badge>
      case 'asistio':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Asistió</Badge>
      case 'falto':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Faltó</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Cargando visitas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="bg-background/50 border-b p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleVolverCalendario}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          
          {/* Fecha con estilo de hoja de calendario */}
          <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-1 px-3">
              {format(fechaSeleccionada, "MMM", { locale: es }).toUpperCase()}
            </div>
            <div className="px-3 py-2 text-center">
              <div className="text-2xl font-bold leading-none">
                {format(fechaSeleccionada, "EEEE d", { locale: es })}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(fechaSeleccionada, "yyyy")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">

        

        {/* Lista de visitas con estilo timeline */}
        {visitasDelDia.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No hay visitas programadas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No tienes visitas programadas para este día
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 relative">
            {/* Línea de tiempo vertical */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
            
            {visitasDelDia.map((visita) => {
              const visitaDate = new Date(visita.fecha_visita.replace(' ', 'T'))
              const isOverdue = isPast(visitaDate) && visita.estado === 'programada'

              return (
                <Card 
                  key={visita.id}
                  className={cn(
                    "cursor-pointer py-1 transition-all duration-200 hover:shadow-md relative ml-8",
                    isOverdue && "border-orange-200 bg-orange-50"
                  )}
                  onClick={() => handleVisitaClick(visita.id)}
                >
                  {/* Punto de la timeline */}
                  <div className="absolute -left-6 top-3 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {/* Nombre de la institución */}
                        <h3 className="font-semibold text-lg mb-1">
                          {visita.institucion?.nombre}
                        </h3>

                        {/* Estado */}
                        <div className="mb-2">
                          {getEstadoBadge(visita.estado)}
                        </div>

                        {/* Dirección */}
                        {visita.institucion?.direccion && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                            {visita.institucion.direccion}
                          </p>
                        )}

                        {/* Indicador de visita vencida */}
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-xs text-orange-700">
                            <AlertCircle className="h-3 w-3" />
                            <span>Visita pendiente</span>
                          </div>
                        )}
                      </div>

                      {/* Hora prominente del lado derecho */}
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {format(visitaDate, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Botón para programar nueva visita */}
        <Dialog open={showVisitaForm} onOpenChange={setShowVisitaForm}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Programar Nueva Visita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Visita</DialogTitle>
            </DialogHeader>
            <VisitaForm 
              defaultDate={fechaSeleccionada}
              onSuccess={handleVisitaCreated}
              onCancel={() => setShowVisitaForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}