import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, MapPin, Calendar, Filter, Eye, Edit, Trash2, Plus, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'

export default function AdminFichasPacientesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const { fichas, loading, deleteFicha } = useFichas()
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
    fichasConFechas: fichas, // Ya no necesitas procesar, las fechas vienen incluidas
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

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta ficha?')) {
      await deleteFicha(id)
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar ficha/paciente</label>
              <Input
                placeholder="Folio o nombre del paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Institución</label>
              <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
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
              <label className="text-sm font-medium">Estado</label>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activos">Activos</SelectItem>
                  <SelectItem value="completados">Completados</SelectItem>
                  <SelectItem value="vencidos">Con faltas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fichas de Tratamiento ({fichasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <TableHead className="min-w-[120px]">Acciones</TableHead>
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
                              {ficha.paciente?.nombre} {ficha.paciente?.apellido_pat} {ficha.paciente?.apellido_mat}
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
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" title="Ver detalles">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Editar ficha">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Eliminar ficha"
                            onClick={() => handleDelete(ficha.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
    </div>
  )
}