import { useState, useMemo, useEffect, useRef } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import { User, MapPin, Filter, FileText, CheckCircle, XCircle, Clock, Building } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useUsers } from '@/hooks/useUsers'
import { contactosService } from '@/services/contactosService'
import type { FichaPaciente } from '@/types/ficha'
import type { Contacto } from '@/types/contacto'
import { cn } from '@/lib/utils'

const COLUMNAS_FECHA = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10']
const PAGE_SIZE = 20

function formatearFechaSegura(fecha?: string | null, patron = 'dd/MM/yy') {
  if (!fecha) return '—'
  const parsed = parseISO(fecha)
  if (!isValid(parsed)) return '—'
  return format(parsed, patron, { locale: es })
}

export default function AdminFichasPacientesPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [busquedaInstitucionTexto, setBusquedaInstitucionTexto] = useState('')
  const [openInstitucionDropdown, setOpenInstitucionDropdown] = useState(false)
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [selectedFicha, setSelectedFicha] = useState<FichaPaciente | null>(null)
  const [pagina, setPagina] = useState(1)

  const { fichas, loading: loadingFichas } = useFichas()
  const { instituciones } = useInstituciones()
  const { users } = useUsers()

  const [pacientes, setPacientes] = useState<Contacto[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)

  useEffect(() => {
    setLoadingPacientes(true)
    contactosService.getContactosByTipo('paciente')
      .then(setPacientes)
      .catch(() => setPacientes([]))
      .finally(() => setLoadingPacientes(false))
  }, [])

  const loading = loadingFichas || loadingPacientes

  const pals = useMemo(() => users.filter(u => u.role === 'pal' && u.activo), [users])
  const palPorId = useMemo(() => new Map(users.map(u => [u.id, u])), [users])

  const fichaPorPacienteId = useMemo(() => {
    const map = new Map<string, FichaPaciente>()
    fichas.forEach(f => map.set(f.paciente_id, f))
    return map
  }, [fichas])

  const formatearNombre = (persona: any) => {
    if (!persona) return 'N/A'
    return [persona.nombre, persona.apellido_pat, persona.apellido_mat].filter(Boolean).join(' ')
  }

  const calcularEdad = (fechaNacimiento?: string | null) => {
    if (!fechaNacimiento) return '—'
    const nacimiento = parseISO(fechaNacimiento)
    if (!isValid(nacimiento)) return '—'
    const hoy = new Date()
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const dm = hoy.getMonth() - nacimiento.getMonth()
    if (dm < 0 || (dm === 0 && hoy.getDate() < nacimiento.getDate())) edad--
    return `${edad}a`
  }


  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i =>
      busquedaInstitucionTexto === '' ||
      i.nombre.toLowerCase().includes(busquedaInstitucionTexto.toLowerCase()) ||
      i.direccion.toLowerCase().includes(busquedaInstitucionTexto.toLowerCase())
    )

  // Lista combinada: cada paciente con su ficha (si existe) y su PAL
  const listaCombinada = useMemo(() => {
    return pacientes.map(paciente => ({
      paciente,
      ficha: fichaPorPacienteId.get(paciente.id) ?? null,
      pal: paciente.pal_id ? palPorId.get(paciente.pal_id) : undefined,
    }))
  }, [pacientes, fichaPorPacienteId, palPorId])

  const listaFiltrada = useMemo(() => {
    return listaCombinada.filter(({ paciente, ficha }) => {
      if (busqueda) {
        const nombreCompleto = formatearNombre(paciente).toLowerCase()
        const folio = ficha?.folio?.toLowerCase() || ''
        const texto = busqueda.toLowerCase()
        if (!nombreCompleto.includes(texto) && !folio.includes(texto)) return false
      }
      if (filtroInstitucion !== 'todos' && paciente.institucion_id !== filtroInstitucion) return false
      if (filtroPal !== 'todos' && paciente.pal_id !== filtroPal) return false
      return true
    })
  }, [listaCombinada, busqueda, filtroInstitucion, filtroPal])

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroInstitucion, filtroPal])

  const totalPaginas = Math.ceil(listaFiltrada.length / PAGE_SIZE)
  const listaPaginada = listaFiltrada.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE)

  const getCeldaFecha = (ficha: FichaPaciente | null, index: number) => {
    if (!ficha) return null
    const fechasOrdenadas = [...(ficha.fechas_tratamiento || [])]
      .sort((a: any, b: any) => a.fecha_programada.localeCompare(b.fecha_programada))
    return fechasOrdenadas[index] || null
  }

  const getIconoFecha = (ft: any) => {
    if (!ft) return null
    const fechaProgramada = parseISO(ft.fecha_programada)
    const pasada = isValid(fechaProgramada) && fechaProgramada < new Date()
    if (ft.asistencia === true) return { icono: CheckCircle, color: 'text-green-600' }
    if (ft.asistencia === false) return { icono: XCircle, color: 'text-red-500' }
    if (pasada) return { icono: XCircle, color: 'text-red-300' }
    return { icono: Clock, color: 'text-yellow-500' }
  }

  // Scroll horizontal por click + arrastre
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scrollLeft: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    dragStart.current = { x: e.pageX, scrollLeft: scrollRef.current.scrollLeft }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const delta = e.pageX - dragStart.current.x
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - delta
  }

  const stopDragging = () => setIsDragging(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fichas de Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Supervisión de pacientes, fichas y fechas de tratamiento
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o folio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-52 h-8 text-sm"
            />

            {/* Institución con buscador propio */}
            <div className="relative w-56">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start font-normal h-8 text-sm"
                onClick={() => setOpenInstitucionDropdown(prev => !prev)}
              >
                <Building className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  {filtroInstitucion === 'todos'
                    ? 'Todas las instituciones'
                    : instituciones.find(i => i.id === filtroInstitucion)?.nombre ?? 'Todas las instituciones'}
                </span>
              </Button>

              {openInstitucionDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto">
                  <div className="p-2 border-b sticky top-0 bg-popover">
                    <Input
                      placeholder="Buscar institución..."
                      defaultValue=""
                      onChange={e => setBusquedaInstitucionTexto(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>

                  <div
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setFiltroInstitucion('todos')
                      setOpenInstitucionDropdown(false)
                      setBusquedaInstitucionTexto('')
                    }}
                  >
                    Todas las instituciones
                  </div>

                  {institucionesFiltradas.map((inst) => (
                    <div
                      key={inst.id}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent truncate"
                      onClick={() => {
                        setFiltroInstitucion(inst.id)
                        setOpenInstitucionDropdown(false)
                        setBusquedaInstitucionTexto('')
                      }}
                    >
                      {inst.nombre}
                    </div>
                  ))}

                  {institucionesFiltradas.length === 0 && (
                    <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                      Sin resultados
                    </div>
                  )}
                </div>
              )}
            </div>

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
              {listaFiltrada.length} pacientes
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Cargando pacientes...
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay pacientes registrados'}
              </p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className={cn('overflow-x-auto', isDragging ? 'cursor-grabbing select-none' : 'cursor-grab')}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={stopDragging}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-muted border-r min-w-[160px] max-w-[160px]">
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
                  {listaPaginada.map(({ paciente, ficha, pal }, idx) => (
                    <TableRow
                      key={paciente.id}
                      className={cn(
                        'transition-colors',
                        ficha ? 'cursor-pointer hover:bg-muted/50' : 'bg-amber-50/60 hover:bg-amber-50'
                      )}
                      onClick={() => { if (ficha) setSelectedFicha(ficha) }}
                    >
                      {/* Columna fija — paciente */}
                      <TableCell
                        className={cn(
                          'sticky left-0 z-10 border-r min-w-[160px] max-w-[160px]',
                          !ficha ? 'bg-amber-50/60' : idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        )}
                      >
                        <div className="space-y-0.5">
                          {ficha ? (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
                              {ficha.folio}
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] px-1 py-0 bg-amber-200 text-amber-900 hover:bg-amber-200 border-amber-300">
                              Sin ficha
                            </Badge>
                          )}
                          <div className="font-medium text-sm leading-tight truncate">
                            {formatearNombre(paciente)}
                          </div>
                          {paciente.institucion && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[130px]">{paciente.institucion.nombre}</span>
                            </div>
                          )}
                          {pal && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[130px]">
                                {pal.nombre_completo}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {calcularEdad(paciente.fecha_nacimiento)}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm line-clamp-2" title={ficha?.diagnostico || ''}>
                          {ficha?.diagnostico || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{ficha?.dosis || '—'}</span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm truncate max-w-[110px] block" title={ficha?.terapia || ''}>
                          {ficha?.terapia || '—'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatearFechaSegura(ficha?.fecha_inicio_tratamiento)}
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
                                {formatearFechaSegura(ft.fecha_programada, 'dd/MM')}
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

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagina} de {totalPaginas} · {listaFiltrada.length} pacientes
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialog detalle — solo para pacientes con ficha */}
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
                        · {formatearFechaSegura(selectedFicha.paciente.fecha_nacimiento, "d 'de' MMMM yyyy")}
                      </span>
                    )}
                  </p>
                  {selectedFicha.paciente?.telefono && (
                    <p className="text-sm text-muted-foreground">{selectedFicha.paciente.telefono}</p>
                  )}
                  {(() => {
                    const pal = (selectedFicha.paciente as any)?.pal_id
                      ? palPorId.get((selectedFicha.paciente as any).pal_id)
                      : undefined
                    return pal ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        PAL: {pal.nombre_completo}
                      </p>
                    ) : null
                  })()}
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
                    Registrada el {formatearFechaSegura(selectedFicha.created_at, "d 'de' MMMM yyyy")}
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
                {selectedFicha.dosis && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dosis</p>
                    <p className="text-sm">{selectedFicha.dosis}</p>
                  </div>
                )}
                {selectedFicha.fecha_inicio_tratamiento && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Inicio de tratamiento</p>
                    <p className="text-sm">
                      {formatearFechaSegura(selectedFicha.fecha_inicio_tratamiento, "d 'de' MMMM yyyy")}
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
                        const fechaProgramada = parseISO(ft.fecha_programada)
                        const pasada = isValid(fechaProgramada) && fechaProgramada < new Date()
                        return (
                          <div key={ft.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground w-6">F{i + 1}</span>
                              <span className="text-sm">
                                {formatearFechaSegura(ft.fecha_programada, "d 'de' MMMM yyyy")}
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