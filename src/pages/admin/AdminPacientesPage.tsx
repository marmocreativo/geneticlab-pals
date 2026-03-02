import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { User, MapPin, Filter, Eye, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import type { FichaPaciente } from '@/types/ficha'

export default function AdminFichasPacientesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [selectedFicha, setSelectedFicha] = useState<FichaPaciente | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { fichas, loading } = useFichas()
  const { instituciones } = useInstituciones()

  // Procesar fechas de tratamiento para generar columnas dinámicas
  const { fichasConFechas, todasLasFechas } = useMemo(() => {
    const fechasSet = new Set<string>()
    
    // Las fechas ya vienen en la respuesta del servicio
    fichas.forEach(ficha => {
      ficha.fechas_tratamiento?.forEach((fecha: any) => {
        fechasSet.add(fecha.fecha_programada)
      })
    })
    
    const fechasOrdenadas = Array.from(fechasSet).sort()
    
    return {
      fichasConFechas: fichas,
      todasLasFechas: fechasOrdenadas
    }
  }, [fichas])

  const fichasFiltradas = fichasConFechas.filter(ficha => {
    // Filtro de búsqueda
    if (busqueda) {
      const nombrePaciente = `${ficha.paciente?.nombre} ${ficha.paciente?.apellido_pat} ${ficha.paciente?.apellido_mat}`.toLowerCase()
      const folio = ficha.folio.toLowerCase()
      const busquedaLower = busqueda.toLowerCase()
      
      if (!nombrePaciente.includes(busquedaLower) && !folio.includes(busquedaLower)) {
        return false
      }
    }
    
    // Filtro por institución
    if (filtroInstitucion !== 'todos' && ficha.institucion_id !== filtroInstitucion) {
      return false
    }
    
    return true
  })

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return 'N/A'
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth()
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return `${edad} años`
  }

  const getEstadoFecha = (ficha: any, fecha: string) => {
    const fechaTratamiento = ficha.fechas_tratamiento?.find(
      (ft: any) => ft.fecha_programada === fecha
    )
    
    if (!fechaTratamiento) return null
    
    // Si marcó asistencia explícitamente
    if (fechaTratamiento.asistencia === true) {
      return { tipo: 'asistio', icono: CheckCircle, color: 'text-green-600' }
    }
    
    // Si marcó que no asistió explícitamente  
    if (fechaTratamiento.asistencia === false) {
      return { tipo: 'falto', icono: XCircle, color: 'text-red-600' }
    }
    
    // Si no hay registro de asistencia (null) y la fecha ya pasó
    const fechaProgramada = new Date(fecha + 'T00:00:00')
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fechaProgramada < hoy) {
      return { tipo: 'pendiente', icono: XCircle, color: 'text-red-600' }
    }
    
    // Fecha futura programada
    return { tipo: 'programada', icono: Clock, color: 'text-yellow-600' }
  }

  const handleViewFicha = (ficha: FichaPaciente) => {
    setSelectedFicha(ficha)
    setShowDetail(true)
  }

  const formatearNombrePaciente = (paciente: any) => {
    if (!paciente) return 'N/A'
    return [paciente.nombre, paciente.apellido_pat, paciente.apellido_mat]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fichas de Pacientes</h1>
          <p className="text-muted-foreground">
            Administra las fichas y fechas de tratamiento de todos los pacientes
          </p>
        </div>
      </div>

      {/* Filtros minimalistas */}
      <Card>
        <CardContent className="py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Input
              placeholder="Buscar folio o paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-[250px]"
            />

            <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Institución" />
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

            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="completados">Completados</SelectItem>
                <SelectItem value="vencidos">Con faltas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Fichas de Tratamiento ({fichasFiltradas.length})</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando fichas...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Paciente</TableHead>
                    <TableHead className="min-w-[120px]">Folio</TableHead>
                    <TableHead className="min-w-[150px]">Institución</TableHead>
                    <TableHead className="min-w-[80px]">Edad</TableHead>
                    <TableHead className="min-w-[120px]">Diagnóstico</TableHead>
                    {todasLasFechas.map((fecha) => (
                      <TableHead key={fecha} className="min-w-[100px] text-center">
                        {format(new Date(fecha), "dd/MM/yy")}
                      </TableHead>
                    ))}
                    <TableHead className="min-w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichasFiltradas.map((ficha) => (
                    <TableRow key={ficha.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="font-medium">
                              {formatearNombrePaciente(ficha.paciente)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {ficha.paciente?.telefono || 'Sin teléfono'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ficha.folio}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{ficha.institucion?.nombre}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">
                          {calcularEdad(ficha.paciente?.fecha_nacimiento)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{ficha.diagnostico || 'No especificado'}</span>
                      </TableCell>

                      {todasLasFechas.map((fecha) => {
                        const estado = getEstadoFecha(ficha, fecha)
                        return (
                          <TableCell key={fecha} className="text-center">
                            {estado ? (
                              <estado.icono className={`w-5 h-5 mx-auto ${estado.color}`} />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )
                      })}

                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewFicha(ficha)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {fichasFiltradas.length === 0 && !loading && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {busqueda ? 'No se encontraron fichas con ese criterio de búsqueda' : 'No hay fichas registradas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle de ficha */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent 
          className="overflow-y-auto" 
          style={{ 
            maxWidth: '90vw', 
            maxHeight: '90vh', 
            width: '90vw',
            height: '90vh'
          }}
        >
          <DialogHeader>
            <DialogTitle>Detalle de Ficha de Paciente</DialogTitle>
          </DialogHeader>

          {selectedFicha && (
            <div className="space-y-6">
              {/* Información del paciente */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Información del Paciente</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                        <p className="text-sm">{formatearNombrePaciente(selectedFicha.paciente)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Edad</label>
                        <p className="text-sm">{calcularEdad(selectedFicha.paciente?.fecha_nacimiento)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                        <p className="text-sm">{selectedFicha.paciente?.telefono || 'No disponible'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fecha de Nacimiento</label>
                        <p className="text-sm">
                          {selectedFicha.paciente?.fecha_nacimiento 
                            ? new Date(selectedFicha.paciente.fecha_nacimiento).toLocaleDateString()
                            : 'No disponible'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Información de la Ficha</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Folio</label>
                        <p className="text-sm font-mono">{selectedFicha.folio}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Institución</label>
                        <p className="text-sm">{selectedFicha.institucion?.nombre}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
                        <p className="text-sm">{new Date(selectedFicha.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Diagnóstico y Terapia */}
              <div className="grid gap-4 md:grid-cols-2">
                {selectedFicha.diagnostico && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Diagnóstico</h3>
                      <p className="text-sm">{selectedFicha.diagnostico}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedFicha.terapia && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Terapia</h3>
                      <p className="text-sm">{selectedFicha.terapia}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Fechas de tratamiento */}
              {selectedFicha.fechas_tratamiento && selectedFicha.fechas_tratamiento.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Cronograma de Tratamiento</h3>
                    <div className="space-y-3">
                      {selectedFicha.fechas_tratamiento.map((fecha: any) => (
                        <div key={fecha.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              {new Date(fecha.fecha_programada).toLocaleDateString()}
                            </div>
                            <Badge variant={fecha.asistencia ? 'default' : 'secondary'}>
                              {fecha.asistencia ? 'Asistió' : 'No asistió'}
                            </Badge>
                          </div>
                          {fecha.notas && (
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {fecha.notas}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}