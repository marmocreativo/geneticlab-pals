import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, MapPin, Filter, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useUsers } from '@/hooks/useUsers'
import type { FichaPaciente } from '@/types/ficha'
import { cn } from '@/lib/utils'

const COLUMNAS_FECHA = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10']

export default function AdminFichasPacientesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [selectedFicha, setSelectedFicha] = useState<FichaPaciente | null>(null)

  const { fichas, loading } = useFichas()
  const { instituciones } = useInstituciones()
  const { users } = useUsers()

  const pals = useMemo(() => users.filter(u => u.role === 'pal' && u.activo), [users])

  const fichasFiltradas = useMemo(() => {
    return fichas.filter(ficha => {
      if (busqueda) {
        const nombrePaciente = `${ficha.paciente?.nombre} ${ficha.paciente?.apellido_pat} ${ficha.paciente?.apellido_mat}`.toLowerCase()
        const folio = ficha.folio.toLowerCase()
        if (!nombrePaciente.includes(busqueda.toLowerCase()) && !folio.includes(busqueda.toLowerCase())) return false
      }
      if (filtroInstitucion !== 'todos' && ficha.institucion_id !== filtroInstitucion) return false
      if (filtroPal !== 'todos') {
        const palId = (ficha.paciente as any)?.pal_id
        if (palId !== filtroPal) return false
      }
      return true
    })
  }, [fichas, busqueda, filtroInstitucion, filtroPal])

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return '—'
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const dm = hoy.getMonth() - nacimiento.getMonth()
    if (dm < 0 || (dm === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return `${edad}a`
  }

  const formatearNombre = (persona: any) => {
    if (!persona) return 'N/A'
    return [persona.nombre, persona.apellido_pat, persona.apellido_mat].filter(Boolean).join(' ')
  }

  const getCeldaFecha = (ficha: FichaPaciente, index: number) => {
    const fechasOrdenadas = [...(ficha.fechas_tratamiento || [])]
      .sort((a: any, b: any) => a.fecha_programada.localeCompare(b.fecha_programada))
    return fechasOrdenadas[index] || null
  }

  const getIconoFecha = (ft: any) => {
    if (!ft) return null
    const pasada = new Date(ft.fecha_programada + 'T00:00:00') < new Date()
    if (ft.asistencia === true) return { icono: CheckCircle, color: 'text-green-600' }
    if (ft.asistencia === false) return { icono: XCircle, color: 'text-red-500' }
    if (pasada) return { icono: XCircle, color: 'text-red-300' }
    return { icono: Clock, color: 'text-yellow-500' }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fichas de Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Administra las fichas y fechas de tratamiento
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar folio o paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-48 h-8 text-sm"
            />
            <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="Institución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las instituciones</SelectItem>
                {instituciones.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroPal} onValueChange={setFiltroPal}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="PAL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los PALs</SelectItem>
                {pals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre_completo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">
              {fichasFiltradas.length} fichas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Cargando fichas...
            </div>
          ) : fichasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay fichas registradas'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-muted border-r min-w-[220px]">
                      Paciente
                    </TableHead>
                    <TableHead className="min-w-[56px]">Edad</TableHead>
                    <TableHead className="min-w-[140px]">Diagnóstico</TableHead>
                    <TableHead className="min-w-[120px]">Dosis</TableHead>
                    <TableHead className="min-w-[120px]">Terapia</TableHead>
                    <TableHead className="min-w-[110px]">Inicio</TableHead>
                    {COLUMNAS_FECHA.map((label) => (
                      <TableHead key={label} className="min-w-[72px] text-center text-xs font-medium">
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichasFiltradas.map((ficha, fichaIdx) => (
                    <TableRow
                      key={ficha.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedFicha(ficha)}
                    >
                      {/* Columna fija — paciente */}
                      <TableCell
                        className={cn(
                          'sticky left-0 z-10 border-r',
                          fichaIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        )}
                      >
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                            {ficha.folio}
                          </Badge>
                          <div className="font-medium text-sm leading-tight">
                            {formatearNombre(ficha.paciente)}
                          </div>
                          {ficha.institucion && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[170px]">{ficha.institucion.nombre}</span>
                            </div>
                          )}
                          {(ficha.paciente as any)?.pal && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[170px]">
                                {(ficha.paciente as any).pal.nombre_completo}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {calcularEdad(ficha.paciente?.fecha_nacimiento)}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm line-clamp-2" title={ficha.diagnostico || ''}>
                          {ficha.diagnostico || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{(ficha as any).dosis || '—'}</span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm truncate max-w-[110px] block" title={ficha.terapia || ''}>
                          {ficha.terapia || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {ficha.fecha_inicio_tratamiento
                            ? format(parseISO(ficha.fecha_inicio_tratamiento), 'dd/MM/yy')
                            : '—'}
                        </span>
                      </TableCell>

                      {/* F1 - F10 */}
                      {COLUMNAS_FECHA.map((_, i) => {
                        const ft = getCeldaFecha(ficha, i)
                        const estado = getIconoFecha(ft)

                        if (!ft || !estado) {
                          return (
                            <TableCell key={i} className="text-center">
                              <span className="text-muted-foreground/20 text-xs">—</span>
                            </TableCell>
                          )
                        }

                        const Icono = estado.icono

                        return (
                          <TableCell key={i} className="text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <Icono className={cn('w-4 h-4', estado.color)} />
                              <span className="text-[10px] text-muted-foreground">
                                {format(parseISO(ft.fecha_programada), 'dd/MM')}
                              </span>
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog detalle */}
      <Dialog open={!!selectedFicha} onOpenChange={(open) => { if (!open) setSelectedFicha(null) }}>
        <DialogContent className="overflow-y-auto max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ficha {selectedFicha?.folio}
            </DialogTitle>
          </DialogHeader>

          {selectedFicha && (
            <div className="space-y-4 py-2">

              {/* Paciente + Ficha */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paciente</p>
                  <p className="font-semibold">{formatearNombre(selectedFicha.paciente)}</p>
                  <p className="text-sm text-muted-foreground">
                    {calcularEdad(selectedFicha.paciente?.fecha_nacimiento)}
                    {selectedFicha.paciente?.fecha_nacimiento && (
                      <span className="ml-2">
                        · {format(parseISO(selectedFicha.paciente.fecha_nacimiento), "d 'de' MMMM yyyy", { locale: es })}
                      </span>
                    )}
                  </p>
                  {selectedFicha.paciente?.telefono && (
                    <p className="text-sm text-muted-foreground">{selectedFicha.paciente.telefono}</p>
                  )}
                  {(selectedFicha.paciente as any)?.pal && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      PAL: {(selectedFicha.paciente as any).pal.nombre_completo}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ficha</p>
                  <Badge variant="outline" className="font-mono">{selectedFicha.folio}</Badge>
                  <p className="text-sm">{selectedFicha.institucion?.nombre}</p>
                  {selectedFicha.doctor && (
                    <p className="text-sm text-muted-foreground">
                      Dr. {formatearNombre(selectedFicha.doctor)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Registrada el {format(parseISO(selectedFicha.created_at), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Tratamiento */}
              <div className="border-t pt-4 grid gap-3 sm:grid-cols-2">
                {selectedFicha.diagnostico && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Diagnóstico</p>
                    <p className="text-sm">{selectedFicha.diagnostico}</p>
                  </div>
                )}
                {selectedFicha.terapia && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Terapia</p>
                    <p className="text-sm">{selectedFicha.terapia}</p>
                  </div>
                )}
                {(selectedFicha as any).dosis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dosis</p>
                    <p className="text-sm">{(selectedFicha as any).dosis}</p>
                  </div>
                )}
                {selectedFicha.fecha_inicio_tratamiento && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Inicio de tratamiento</p>
                    <p className="text-sm">
                      {format(parseISO(selectedFicha.fecha_inicio_tratamiento), "d 'de' MMMM yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              {/* Cronograma */}
              {(selectedFicha.fechas_tratamiento?.length ?? 0) > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Cronograma de tratamiento
                  </p>
                  <div className="divide-y">
                    {[...(selectedFicha.fechas_tratamiento ?? [])]
                      .sort((a: any, b: any) => a.fecha_programada.localeCompare(b.fecha_programada))
                      .map((ft: any, i: number) => {
                        const pasada = new Date(ft.fecha_programada + 'T00:00:00') < new Date()
                        return (
                          <div key={ft.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-6">F{i + 1}</span>
                              <span className="text-sm">
                                {format(parseISO(ft.fecha_programada), "d 'de' MMMM yyyy", { locale: es })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {ft.notas && (
                                <span className="text-xs text-muted-foreground truncate max-w-32" title={ft.notas}>
                                  {ft.notas}
                                </span>
                              )}
                              {ft.asistencia === true && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Asistió
                                </Badge>
                              )}
                              {ft.asistencia === false && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  No asistió
                                </Badge>
                              )}
                              {ft.asistencia === null && pasada && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-300 border-red-100">
                                  Sin registro
                                </Badge>
                              )}
                              {ft.asistencia === null && !pasada && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Programada
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}