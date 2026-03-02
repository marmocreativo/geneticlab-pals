import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ArrowLeft, Plus, Calendar, FileText, Trash2, Edit, ChevronDown, ChevronUp, Clock, Building } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useFechasTratamiento } from '@/hooks/useFechasTratamiento'
import { contactosService } from '@/services/contactosService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FechasTratamientoInsert } from '@/types/ficha'

export default function FechasTratamientoPage() {
  const { fichaId } = useParams<{ fichaId: string }>()
  const navigate = useNavigate()
  const { getFichaById } = useFichas()
  const { fechas, loading, fetchFechasByFicha, createFecha, updateFecha, deleteFecha } = useFechasTratamiento()

  const [ficha, setFicha] = useState<any>(null)
  const [loadingFicha, setLoadingFicha] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingFecha, setEditingFecha] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState<FechasTratamientoInsert>({
    ficha_id: fichaId || '',
    fecha_programada: '',
    asistencia: false,
    notas: ''
  })

  // Cargar datos de la ficha
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

  // Cargar fechas de tratamiento
  useEffect(() => {
    if (fichaId) {
      fetchFechasByFicha(fichaId)
    }
  }, [fichaId])

  const resetForm = () => {
    setFormData({
      ficha_id: fichaId || '',
      fecha_programada: '',
      asistencia: false,
      notas: ''
    })
    setEditingFecha(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFecha) {
        await updateFecha(editingFecha.id, {
          fecha_programada: formData.fecha_programada,
          asistencia: formData.asistencia,
          notas: formData.notas
        })
      } else {
        await createFecha(formData)
      }
      setOpenDialog(false)
      resetForm()
    } catch (error) {
      console.error('Error saving fecha:', error)
    }
  }

  const handleEdit = (fecha: any) => {
    setEditingFecha(fecha)
    setFormData({
      ficha_id: fecha.ficha_id,
      fecha_programada: fecha.fecha_programada,
      asistencia: fecha.asistencia,
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

  const toggleExpand = (fechaId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(fechaId)) {
      newExpanded.delete(fechaId)
    } else {
      newExpanded.add(fechaId)
    }
    setExpandedItems(newExpanded)
  }

  if (loadingFicha) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando datos del paciente...</div>
      </div>
    )
  }

  if (!ficha) {
    return (
      <div className="p-6">
        <div className="text-center">No se encontró la ficha del paciente</div>
      </div>
    )
  }

  const edad = ficha.paciente?.fecha_nacimiento 
    ? calcularEdad(ficha.paciente.fecha_nacimiento)
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Botón de volver */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/pal/pacientes')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      {/* Título completo */}
      <div>
        <h1 className="text-3xl font-bold">Fechas de Tratamiento</h1>
        <p className="text-muted-foreground mt-1">
          Control y seguimiento de citas programadas del paciente
        </p>
      </div>

      {/* Información del paciente y ficha en una sola card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Información principal */}
            <div>
              <h2 className="text-2xl font-bold mb-2">{formatearNombre(ficha.paciente)}</h2>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{ficha.institucion?.nombre}</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">Folio: {ficha.folio}</span>
                </div>
                {ficha.diagnostico && (
                  <Badge variant="outline" className="text-sm">
                    {ficha.diagnostico}
                  </Badge>
                )}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t my-4"></div>

            {/* Datos secundarios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {edad && (
                <div>
                  <span className="text-muted-foreground">Edad:</span>
                  <p className="font-medium">{edad} años</p>
                </div>
              )}
              {ficha.paciente?.telefono && (
                <div>
                  <span className="text-muted-foreground">Teléfono:</span>
                  <p className="font-medium">{ficha.paciente.telefono}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Fecha de registro:</span>
                <p className="font-medium">{new Date(ficha.created_at).toLocaleDateString()}</p>
              </div>
              {ficha.terapia && (
                <div className="md:col-span-3">
                  <span className="text-muted-foreground">Terapia:</span>
                  <p className="font-medium">{ficha.terapia}</p>
                </div>
              )}
            </div>
          </div>
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
            
            {/* Botón agregar fecha - solo desktop */}
            <div className="hidden md:block">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingFecha ? 'Editar Fecha' : 'Nueva Fecha de Tratamiento'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fecha_programada">Fecha programada *</Label>
                      <Input
                        id="fecha_programada"
                        type="date"
                        value={formData.fecha_programada}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          fecha_programada: e.target.value 
                        }))}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="asistencia"
                        checked={formData.asistencia}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            asistencia: checked as boolean 
                          }))
                        }
                      />
                      <Label htmlFor="asistencia">Paciente asistió</Label>
                    </div>

                    <div>
                      <Label htmlFor="notas">Notas</Label>
                      <Textarea
                        id="notas"
                        value={formData.notas}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          notas: e.target.value 
                        }))}
                        placeholder="Observaciones del tratamiento..."
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingFecha ? 'Actualizar' : 'Agregar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando fechas...</p>
              </div>
            ) : fechas.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No hay fechas de tratamiento registradas</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Asistencia</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fechas.map((fecha) => (
                      <TableRow key={fecha.id}>
                        <TableCell className="font-medium">
                          {new Date(fecha.fecha_programada).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={fecha.asistencia ? "default" : "secondary"}>
                            {fecha.asistencia ? "Asistió" : "No asistió"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {fecha.notas ? (
                            <div className="truncate" title={fecha.notas}>
                              {fecha.notas}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(fecha.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(fecha)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(fecha.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Vista Mobile - Timeline */}
          <div className="md:hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-muted-foreground">Cargando fechas...</p>
              </div>
            ) : fechas.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No hay fechas registradas</p>
                <p className="text-sm text-muted-foreground">Agrega la primera fecha de tratamiento</p>
              </div>
            ) : (
              <div className="space-y-3 px-0 relative">
                {/* Línea de tiempo vertical */}
                <div className="absolute left-8 top-0 bottom-0 w-px bg-border"></div>
                
                {fechas.map((fecha) => (
                  <Collapsible key={fecha.id}>
                    <Card className="hover:shadow-md transition-shadow relative ml-16">
                      {/* Punto de la timeline */}
                      <div className="absolute -left-10 top-4 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                      
                      <CollapsibleTrigger 
                        className="w-full"
                        onClick={() => toggleExpand(fecha.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 text-left space-y-2">
                              {/* Fecha con aspecto de hoja de calendario */}
                              <div className="flex items-center gap-3">
                                <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
                                  <div className="bg-primary text-primary-foreground text-xs font-medium text-center py-1 px-2">
                                    {format(new Date(fecha.fecha_programada), "MMM", { locale: es }).toUpperCase()}
                                  </div>
                                  <div className="px-2 py-1 text-center">
                                    <div className="text-lg font-bold leading-none">
                                      {format(new Date(fecha.fecha_programada), "d")}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Estado de asistencia */}
                                <Badge variant={fecha.asistencia ? "default" : "secondary"}>
                                  {fecha.asistencia ? "Asistió" : "No asistió"}
                                </Badge>
                              </div>

                              {/* Notas como información secundaria */}
                              {fecha.notas && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {fecha.notas}
                                </p>
                              )}
                            </div>

                            {/* Icono de expansión */}
                            <div className="flex-shrink-0">
                              {expandedItems.has(fecha.id) ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      
                      {/* Contenido expandible */}
                      <CollapsibleContent>
                        <CardContent className="pt-0 px-4 pb-4">
                          <div className="border-t pt-4 space-y-3">
                            {/* Fecha completa */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(fecha.fecha_programada), "d 'de' MMMM, yyyy", { locale: es })}
                              </span>
                            </div>

                            {/* Fecha de registro */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Registrado: {new Date(fecha.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* Notas completas si hay */}
                            {fecha.notas && (
                              <div>
                                <span className="text-sm font-medium">Observaciones:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {fecha.notas}
                                </p>
                              </div>
                            )}

                            {/* Acciones */}
                            <div className="flex gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(fecha)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(fecha.id)}
                                className="flex-1"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Botón agregar fecha - ancho completo al final en mobile */}
            <div className="mt-6">
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nueva Fecha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingFecha ? 'Editar Fecha' : 'Nueva Fecha de Tratamiento'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fecha_programada">Fecha programada *</Label>
                      <Input
                        id="fecha_programada"
                        type="date"
                        value={formData.fecha_programada}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          fecha_programada: e.target.value 
                        }))}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="asistencia"
                        checked={formData.asistencia}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ 
                            ...prev, 
                            asistencia: checked as boolean 
                          }))
                        }
                      />
                      <Label htmlFor="asistencia">Paciente asistió</Label>
                    </div>

                    <div>
                      <Label htmlFor="notas">Notas</Label>
                      <Textarea
                        id="notas"
                        value={formData.notas}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          notas: e.target.value 
                        }))}
                        placeholder="Observaciones del tratamiento..."
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingFecha ? 'Actualizar' : 'Agregar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}