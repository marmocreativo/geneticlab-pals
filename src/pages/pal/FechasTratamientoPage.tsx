import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, Plus, Calendar as CalendarIcon, Trash2, Edit, ChevronDown } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useFechasTratamiento } from '@/hooks/useFechasTratamiento'
import { contactosService } from '@/services/contactosService'
import { format, addDays, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FechasTratamientoInsert, FechasTratamientoUpdate } from '@/types/ficha'
import type { PeriodicidadFicha } from '@/types/database.types'

type EstadoFecha = 'pendiente' | 'asistio' | 'falto'

const ESTADO_CONFIG: Record<EstadoFecha, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'outline' },
  asistio: { label: 'Asistió', variant: 'default' },
  falto: { label: 'No asistió', variant: 'secondary' },
}

const PERIODICIDAD_LABELS: Record<PeriodicidadFicha, string> = {
  semanal: 'Semanal',
  cada_2_semanas: 'Cada 2 semanas',
  cada_3_semanas: 'Cada 3 semanas',
  cada_4_semanas: 'Cada 4 semanas',
}

interface FormData {
  ficha_id: string
  fecha_programada: string
  estado: EstadoFecha
  notas: string
}

function diasDePeriodicidad(periodicidad: PeriodicidadFicha): number {
  switch (periodicidad) {
    case 'semanal': return 7
    case 'cada_2_semanas': return 14
    case 'cada_3_semanas': return 21
    case 'cada_4_semanas': return 28
  }
}

function calcularFechasSugeridas(
  fechaInicio: string,
  periodicidad: PeriodicidadFicha,
  limite: number = 10
): Date[] {
  const inicio = new Date(fechaInicio)
  const intervalo = diasDePeriodicidad(periodicidad)
  const fechas: Date[] = []
  for (let i = 1; i <= limite; i++) {
    fechas.push(addDays(inicio, intervalo * i))
  }
  return fechas
}

export default function FechasTratamientoPage() {
  const { fichaId } = useParams<{ fichaId: string }>()
  const navigate = useNavigate()
  const { getFichaById } = useFichas()
  const { fechas, loading, fetchFechasByFicha, createFecha, updateFecha, deleteFecha } = useFechasTratamiento()

  const [ficha, setFicha] = useState<any>(null)
  const [loadingFicha, setLoadingFicha] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFecha, setEditingFecha] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const [formData, setFormData] = useState<FormData>({
    ficha_id: fichaId || '',
    fecha_programada: '',
    estado: 'pendiente',
    notas: ''
  })

  useEffect(() => {
    const loadFicha = async () => {
      if (fichaId) {
        try {
          setLoadingFicha(true)
          const fichaData = await getFichaById(fichaId)
          setFicha(fichaData)
        } catch (error) {
          console.error('Error loading ficha:', error)
        } finally {
          setLoadingFicha(false)
        }
      }
    }
    loadFicha()
  }, [fichaId])

  useEffect(() => {
    if (fichaId) {
      fetchFechasByFicha(fichaId)
    }
  }, [fichaId])

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        fecha_programada: format(selectedDate, 'yyyy-MM-dd')
      }))
    }
  }, [selectedDate])

  const fechasSugeridas = useMemo((): Date[] => {
    if (!ficha?.fecha_inicio_tratamiento || !ficha?.periodicidad) return []
    return calcularFechasSugeridas(ficha.fecha_inicio_tratamiento, ficha.periodicidad)
  }, [ficha?.fecha_inicio_tratamiento, ficha?.periodicidad])

  const fechasRegistradas = useMemo((): Date[] => {
    return fechas.map(f => new Date(f.fecha_programada))
  }, [fechas])

  const resetForm = () => {
    setFormData({
      ficha_id: fichaId || '',
      fecha_programada: '',
      estado: 'pendiente',
      notas: ''
    })
    setSelectedDate(undefined)
    setEditingFecha(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFecha) {
        const updates: FechasTratamientoUpdate = {
          fecha_programada: formData.fecha_programada,
          estado: formData.estado,
          notas: formData.notas
        }
        await updateFecha(editingFecha.id, updates)
      } else {
        const insert: FechasTratamientoInsert = {
          ficha_id: formData.ficha_id,
          fecha_programada: formData.fecha_programada,
          estado: formData.estado,
          notas: formData.notas
        }
        await createFecha(insert)
      }
      setOpenDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error saving fecha:', error)
    }
  }

  const handleEdit = (fecha: any) => {
    setEditingFecha(fecha)
    setSelectedDate(new Date(fecha.fecha_programada))
    setFormData({
      ficha_id: fecha.ficha_id,
      fecha_programada: fecha.fecha_programada,
      estado: fecha.estado ?? 'pendiente',
      notas: fecha.notas || ''
    })
    setOpenDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta fecha?')) {
      await deleteFecha(id)
    }
  }

  const formatearNombre = (paciente: any) => {
    if (!paciente) return 'Sin datos'
    return contactosService.formatearNombreCompleto(paciente)
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null
    return contactosService.calcularEdad(fechaNacimiento)
  }


  const formulario = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Fecha programada <span className="text-destructive">*</span></Label>

        {/* Nota de periodicidad */}
        {ficha?.periodicidad && (
          <p className="text-xs text-muted-foreground">
            Periodicidad del tratamiento: <strong>{PERIODICIDAD_LABELS[ficha.periodicidad as PeriodicidadFicha]}</strong>. Las fechas sugeridas se muestran en azul claro.
          </p>
        )}

        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={es}
            modifiers={{
              inicio: ficha?.fecha_inicio_tratamiento
                ? [new Date(ficha.fecha_inicio_tratamiento)]
                : [],
              sugerida: fechasSugeridas.filter(
                s => !fechasRegistradas.some(r => isSameDay(r, s))
              ),
              registrada: fechasRegistradas,
              fin: ficha?.fecha_final_tratamiento
                ? [new Date(ficha.fecha_final_tratamiento)]
                : [],
            }}
            modifiersClassNames={{
              inicio: 'bg-green-600 text-white font-bold rounded-md',
              sugerida: 'bg-blue-100 text-blue-800 font-medium rounded-md',
              registrada: 'bg-green-100 text-green-800 font-medium rounded-md',
              fin: 'bg-red-500 text-white font-bold rounded-md',
            }}
          />
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
          {ficha?.fecha_inicio_tratamiento && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-600" />
              <span>Inicio</span>
            </div>
          )}
          {fechasSugeridas.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span>Sugerida</span>
            </div>
          )}
          {fechasRegistradas.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span>Registrada</span>
            </div>
          )}
          {ficha?.fecha_final_tratamiento && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Fin</span>
            </div>
          )}
        </div>

        {formData.fecha_programada && (
          <p className="text-sm text-center text-muted-foreground">
            Seleccionado: <strong>{format(new Date(formData.fecha_programada), "d 'de' MMMM, yyyy", { locale: es })}</strong>
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Estado</Label>
        <Select
          value={formData.estado}
          onValueChange={(v) => setFormData(prev => ({ ...prev, estado: v as EstadoFecha }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="asistio">Asistió</SelectItem>
            <SelectItem value="falto">No asistió</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          value={formData.notas}
          onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
          placeholder="Observaciones del tratamiento..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { setOpenDialog(false); resetForm() }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!formData.fecha_programada}>
          {editingFecha ? 'Actualizar' : 'Agregar'}
        </Button>
      </div>
    </form>
  )

  if (loadingFicha) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cargando datos del paciente...
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No se encontró la ficha del paciente
      </div>
    )
  }

  const edad = ficha.paciente?.fecha_nacimiento
    ? calcularEdad(ficha.paciente.fecha_nacimiento)
    : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/pal/pacientes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Fechas de Tratamiento</h1>
      </div>

      {/* Info del paciente */}
      <Card>
        <CardContent className="p-4 space-y-3">

          {/* Folio + Status */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-mono">{ficha.folio}</span>
            <Badge variant={ficha.status === 'en_tx' ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
              {ficha.status === 'en_tx' ? 'En Tx' : 'Fuera Tx'}
            </Badge>
          </div>

          <div className="border-t" />

          {/* Nombre, médico, institución */}
          <div className="space-y-1">
            <p className="font-semibold text-sm leading-tight">{formatearNombre(ficha.paciente)}</p>
            {ficha.doctor && (
              <p className="text-xs text-muted-foreground">{formatearNombre(ficha.doctor)}</p>
            )}
            <p className="text-xs text-muted-foreground">{ficha.institucion?.nombre}</p>
          </div>

          <div className="border-t" />

          {/* Diagnóstico, dosis, terapia */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Diagnóstico</p>
              <p className="font-medium truncate">{ficha.diagnostico || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dosis</p>
              <p className="font-medium truncate">{ficha.dosis || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Terapia</p>
              <p className="font-medium truncate">{ficha.terapia || '—'}</p>
            </div>
          </div>

          <div className="border-t" />

          {/* Fechas y periodicidad */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Inicio</p>
              <p className="font-medium">
                {ficha.fecha_inicio_tratamiento
                  ? format(new Date(ficha.fecha_inicio_tratamiento), 'd MMM yyyy', { locale: es })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Periodicidad</p>
              <p className="font-medium">
                {ficha.periodicidad
                  ? PERIODICIDAD_LABELS[ficha.periodicidad as PeriodicidadFicha]
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Fin</p>
              <p className="font-medium">
                {ficha.fecha_final_tratamiento
                  ? format(new Date(ficha.fecha_final_tratamiento), 'd MMM yyyy', { locale: es })
                  : '—'}
              </p>
            </div>
          </div>

          <div className="border-t" />

          {/* Datos extra colapsables */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-7">
                <ChevronDown className="h-3 w-3 mr-1" />
                Más información
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
                {edad && (
                  <div>
                    <p className="text-muted-foreground">Edad</p>
                    <p className="font-medium">{edad} años</p>
                  </div>
                )}
                {ficha.paciente?.telefono && (
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{ficha.paciente.telefono}</p>
                  </div>
                )}
                {ficha.numero_pm && (
                  <div>
                    <p className="text-muted-foreground">Núm. PM</p>
                    <p className="font-medium">{ficha.numero_pm}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Registro</p>
                  <p className="font-medium">{new Date(ficha.created_at).toLocaleDateString('es-MX')}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>

      {/* Fechas de tratamiento */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold">Cronograma de Tratamiento</h3>
              <p className="text-sm text-muted-foreground">
                {fechas.length} {fechas.length === 1 ? 'fecha registrada' : 'fechas registradas'}
              </p>
            </div>
            <div className="hidden md:block">
              <Dialog open={openDialog} onOpenChange={(v) => { setOpenDialog(v); if (!v) resetForm() }}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingFecha ? 'Editar Fecha' : 'Nueva Fecha de Tratamiento'}</DialogTitle>
                  </DialogHeader>
                  {formulario}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabla Desktop */}
          <div className="hidden md:block">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando fechas...</div>
            ) : fechas.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No hay fechas de tratamiento registradas</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fechas.map((fecha) => {
                      const estado = (fecha.estado ?? 'pendiente') as EstadoFecha
                      const config = ESTADO_CONFIG[estado]
                      return (
                        <TableRow key={fecha.id}>
                          <TableCell className="font-medium">
                            {new Date(fecha.fecha_programada).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {fecha.notas ? (
                              <span className="truncate block" title={fecha.notas}>{fecha.notas}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(fecha.created_at).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(fecha)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(fecha.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Timeline Mobile */}
          <div className="md:hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Cargando fechas...</p>
              </div>
            ) : fechas.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No hay fechas registradas</p>
                <p className="text-sm text-muted-foreground">Agrega la primera fecha de tratamiento</p>
              </div>
            ) : (
              <div className="space-y-3 relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {fechas.map((fecha) => {
                  const estado = (fecha.estado ?? 'pendiente') as EstadoFecha
                  const config = ESTADO_CONFIG[estado]
                  return (
                    <div key={fecha.id} className="relative ml-8">
                      <div className="absolute -left-6 top-4 w-2 h-2 bg-primary rounded-full" />
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Hoja de calendario */}
                              <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                                <div className="bg-primary text-primary-foreground text-[10px] font-medium text-center py-0.5 px-2">
                                  {format(new Date(fecha.fecha_programada), 'MMM', { locale: es }).toUpperCase()}
                                </div>
                                <div className="px-2 py-1 text-center">
                                  <div className="text-base font-bold leading-none">
                                    {format(new Date(fecha.fecha_programada), 'd')}
                                  </div>
                                </div>
                              </div>

                              {/* Info */}
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium">
                                  {format(new Date(fecha.fecha_programada), "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                                <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                                {fecha.notas && (
                                  <p className="text-xs text-muted-foreground">{fecha.notas}</p>
                                )}
                              </div>
                            </div>

                            {/* Botones icono */}
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEdit(fecha)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => handleDelete(fecha.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6">
              <Dialog open={openDialog} onOpenChange={(v) => { setOpenDialog(v); if (!v) resetForm() }}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nueva Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingFecha ? 'Editar Fecha' : 'Nueva Fecha de Tratamiento'}</DialogTitle>
                  </DialogHeader>
                  {formulario}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}