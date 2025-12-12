import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Clock, MapPin, User, Camera, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useVisitas } from '@/hooks/useVisitas'
import { useUsers } from '@/hooks/useUsers'
import { useInstituciones } from '@/hooks/useInstituciones'

export default function AdminAgendaPage() {
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const [fechaFin, setFechaFin] = useState<Date>(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [seleccionandoInicio, setSeleccionandoInicio] = useState(true)
  
  // Filtros
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const { visitas, loading, fetchVisitasByDateRange } = useVisitas()
  const { users } = useUsers()
  const { instituciones } = useInstituciones()

  const pals = users.filter(user => user.role === 'pal')

  useEffect(() => {
    handleBuscar()
  }, [])

  const handleBuscar = () => {
    const inicio = startOfDay(fechaInicio)
    const fin = endOfDay(fechaFin)
    fetchVisitasByDateRange(inicio.toISOString(), fin.toISOString())
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      if (seleccionandoInicio) {
        setFechaInicio(date)
        setSeleccionandoInicio(false)
      } else {
        setFechaFin(date)
        setShowCalendar(false)
        setSeleccionandoInicio(true)
      }
    }
  }

  // Filtrar visitas según los criterios seleccionados
  const visitasFiltradas = visitas?.filter(visita => {
    if (filtroInstitucion !== 'todos' && visita.institucion_id !== filtroInstitucion) return false
    if (filtroPal !== 'todos' && visita.pal_id !== filtroPal) return false
    if (filtroEstado !== 'todos' && visita.estado !== filtroEstado) return false
    return true
  }) || []

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'asistio':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'falto':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'programada':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
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
      <Badge variant={variants[estado as keyof typeof variants] || 'secondary'}>
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agenda de Visitas</h1>
        <p className="text-muted-foreground">
          Consulta las visitas programadas y realizadas en un período específico
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(fechaInicio, "dd MMM", { locale: es })} - {format(fechaFin, "dd MMM yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <p className="text-sm text-muted-foreground">
                      {seleccionandoInicio ? 'Selecciona fecha de inicio' : 'Selecciona fecha de fin'}
                    </p>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={seleccionandoInicio ? fechaInicio : fechaFin}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Institución</label>
              <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las instituciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las instituciones</SelectItem>
                  {instituciones.map((institucion) => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PAL</label>
              <Select value={filtroPal} onValueChange={setFiltroPal}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los PALs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los PALs</SelectItem>
                  {pals.map((pal) => (
                    <SelectItem key={pal.id} value={pal.id}>
                      {pal.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="programada">Programada</SelectItem>
                  <SelectItem value="asistio">Asistió</SelectItem>
                  <SelectItem value="falto">Faltó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleBuscar} className="w-full" disabled={loading}>
            {loading ? 'Consultando...' : 'Consultar Período'}
          </Button>
        </CardContent>
      </Card>

      {visitasFiltradas && visitasFiltradas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visitas Encontradas ({visitasFiltradas.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>PAL</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead>Evidencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitasFiltradas.map((visita) => (
                  <TableRow key={visita.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(new Date(visita.fecha_visita), "dd MMM yyyy", { locale: es })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(visita.fecha_visita), "HH:mm")}
                        </div>
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
                      <Badge variant="outline">
                        {visita.tipo_visita === 'presencial' ? 'Presencial' : 'Teléfono'}
                      </Badge>
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

                    <TableCell>
                      {visita.fotos_evidencia && visita.fotos_evidencia.length > 0 ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-muted">
                              <Camera className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm underline cursor-pointer">
                                {visita.fotos_evidencia.length} foto(s)
                              </span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {visita.fotos_evidencia.map((foto) => (
                                <img
                                  key={foto.id}
                                  src={foto.url_storage}
                                  alt="Evidencia de visita"
                                  className="w-full h-auto rounded-lg"
                                />
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">0 fotos</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(!visitasFiltradas || visitasFiltradas.length === 0) && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No se encontraron visitas en el período seleccionado</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}