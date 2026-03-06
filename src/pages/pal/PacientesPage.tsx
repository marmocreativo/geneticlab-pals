import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import FichaForm from '@/components/pacientes/FichaForm'
import { Search, Filter, ChevronDown, ChevronUp, Building, Calendar, Phone, FileText, Pencil, Check, X, Stethoscope, Plus } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useContactos } from '@/hooks/useContactos'
import { useAuth } from '@/contexts/AuthContext'
import { contactosService } from '@/services/contactosService'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FichaPaciente, FichaPacienteUpdate } from '@/types/ficha'
import type { ContactoInsert, Contacto } from '@/types/contacto'

interface EditFormState {
  doctor_id: string
  diagnostico: string
  terapia: string
  dosis: string
  fecha_inicio_tratamiento: string
}

export default function PacientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fichas, loading, fetchFichas, buscarFichas, updateFicha } = useFichas()
  const { instituciones } = useInstituciones()
  const { formatearNombreCompleto, createContacto } = useContactos()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [filteredFichas, setFilteredFichas] = useState<FichaPaciente[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const [editingFicha, setEditingFicha] = useState<FichaPaciente | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    doctor_id: '',
    diagnostico: '',
    terapia: '',
    dosis: '',
    fecha_inicio_tratamiento: '',
  })
  const [editErrors, setEditErrors] = useState<Partial<EditFormState>>({})
  const [saving, setSaving] = useState(false)

  const [medicosEdit, setMedicosEdit] = useState<Contacto[]>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)
  const [createNewMedico, setCreateNewMedico] = useState(false)
  const [nuevoMedicoData, setNuevoMedicoData] = useState<ContactoInsert>({
    tipo_contacto: 'medico',
    nombre: '',
    apellido_pat: '',
    apellido_mat: '',
    telefono: '',
    pal_id: user?.id || ''
  })

  useEffect(() => {
    const now = new Date()
    setFechaInicio(format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'))
    setFechaFin(format(endOfMonth(now), 'yyyy-MM-dd'))
  }, [])

  useEffect(() => {
    let result = fichas
    if (selectedInstitucion && selectedInstitucion !== 'all') {
      result = result.filter(ficha => ficha.institucion_id === selectedInstitucion)
    }
    if (fechaInicio) {
      result = result.filter(ficha => new Date(ficha.created_at) >= new Date(fechaInicio))
    }
    if (fechaFin) {
      result = result.filter(ficha => new Date(ficha.created_at) <= new Date(fechaFin))
    }
    setFilteredFichas(result)
  }, [fichas, selectedInstitucion, fechaInicio, fechaFin])

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await buscarFichas(searchTerm)
    } else {
      await fetchFichas()
    }
  }

  const clearFilters = () => {
    const now = new Date()
    setSearchTerm('')
    setSelectedInstitucion('all')
    setFechaInicio(format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'))
    setFechaFin(format(endOfMonth(now), 'yyyy-MM-dd'))
    fetchFichas()
  }

  const formatearNombre = (contacto: any) => {
    if (!contacto) return 'Sin datos'
    return [contacto.nombre, contacto.apellido_pat, contacto.apellido_mat].filter(Boolean).join(' ')
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null
    return contactosService.calcularEdad(fechaNacimiento)
  }

  const formatDateRange = () => {
    if (!fechaInicio || !fechaFin) return 'Seleccionar período'
    return `${format(new Date(fechaInicio), 'd MMM', { locale: es })} - ${format(new Date(fechaFin), 'd MMM yyyy', { locale: es })}`
  }

  const toggleExpand = (fichaId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(fichaId)) {
      newExpanded.delete(fichaId)
    } else {
      newExpanded.add(fichaId)
    }
    setExpandedItems(newExpanded)
  }

  const handleOpenEdit = async (ficha: FichaPaciente) => {
    setEditingFicha(ficha)
    setEditForm({
      doctor_id: ficha.doctor_id || '',
      diagnostico: ficha.diagnostico || '',
      terapia: ficha.terapia || '',
      dosis: ficha.dosis || '',
      fecha_inicio_tratamiento: ficha.fecha_inicio_tratamiento || '',
    })
    setEditErrors({})
    setCreateNewMedico(false)
    setNuevoMedicoData({
      tipo_contacto: 'medico',
      nombre: '',
      apellido_pat: '',
      apellido_mat: '',
      telefono: '',
      pal_id: user?.id || ''
    })

    setLoadingMedicos(true)
    try {
      const data = await contactosService.getContactosByInstitucion(ficha.institucion_id)
      setMedicosEdit(data.filter(c => c.tipo_contacto === 'medico'))
    } catch {
      setMedicosEdit([])
    } finally {
      setLoadingMedicos(false)
    }
  }

  const handleCloseEdit = () => {
    setEditingFicha(null)
    setEditForm({ doctor_id: '', diagnostico: '', terapia: '', dosis: '', fecha_inicio_tratamiento: '' })
    setEditErrors({})
    setMedicosEdit([])
    setCreateNewMedico(false)
    setNuevoMedicoData({
      tipo_contacto: 'medico',
      nombre: '',
      apellido_pat: '',
      apellido_mat: '',
      telefono: '',
      pal_id: user?.id || ''
    })
  }

  const validateEdit = (): boolean => {
    const errors: Partial<EditFormState> = {}
    if (!editForm.dosis.trim()) errors.dosis = 'Requerido'
    if (!editForm.fecha_inicio_tratamiento) errors.fecha_inicio_tratamiento = 'Requerido'
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!editingFicha || !validateEdit()) return
    setSaving(true)
    try {
      let doctorId = editForm.doctor_id || undefined

      if (createNewMedico && nuevoMedicoData.nombre.trim()) {
        const nuevo = await createContacto({
          ...nuevoMedicoData,
          institucion_id: editingFicha.institucion_id
        })
        doctorId = nuevo.id
      }

      const updates: FichaPacienteUpdate = {
        doctor_id: doctorId,
        diagnostico: editForm.diagnostico || undefined,
        terapia: editForm.terapia || undefined,
        dosis: editForm.dosis,
        fecha_inicio_tratamiento: editForm.fecha_inicio_tratamiento,
      }
      await updateFicha(editingFicha.id, updates)
      handleCloseEdit()
    } catch {
      // el hook ya muestra el toast
    } finally {
      setSaving(false)
    }
  }

  const fieldEdit = (key: keyof EditFormState, value: string) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
    if (editErrors[key]) setEditErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const thisMonthCount = filteredFichas.filter(ficha =>
    new Date(ficha.created_at).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header Desktop */}
      <div className="hidden md:flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground">Gestión de fichas y seguimiento de pacientes</p>
        </div>
        <FichaForm onSuccess={fetchFichas} />
      </div>

      {/* Header Mobile */}
      <div className="md:hidden">
        <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
        <p className="text-muted-foreground mt-1">Registro y seguimiento de pacientes registrados</p>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 py-0 text-center">
            <p className="text-sm text-muted-foreground">Total Pacientes</p>
            <p className="text-3xl font-bold">{filteredFichas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-0 text-center">
            <p className="text-sm text-muted-foreground">Fichas Activas</p>
            <p className="text-3xl font-bold">{filteredFichas.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-0 text-center">
            <p className="text-sm text-muted-foreground">Este Mes</p>
            <p className="text-3xl font-bold">{thisMonthCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Botón nueva ficha Desktop */}
      <div className="hidden md:flex justify-end">
        <FichaForm onSuccess={fetchFichas} />
      </div>

      {/* Botones Mobile */}
      <div className="md:hidden flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-[2] justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="truncate">{formatDateRange()}</span>
          </div>
          {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <FichaForm onSuccess={fetchFichas} />
        </div>
      </div>

      {/* Filtros Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar por folio</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar folio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Institución</label>
                <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las instituciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las instituciones</SelectItem>
                    {instituciones.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha desde</label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Mobile colapsables */}
      <div className="md:hidden">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar por folio</label>
                  <Input
                    placeholder="Buscar folio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institución</label>
                  <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {instituciones.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha desde</label>
                    <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha hasta</label>
                    <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar Filtros</Button>
                  <span className="text-sm text-muted-foreground">
                    {loading ? 'Cargando...' : `${filteredFichas.length} pacientes`}
                  </span>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Fichas de Pacientes</h2>
              <span className="text-sm text-muted-foreground">
                {loading ? 'Cargando...' : `${filteredFichas.length} pacientes encontrados`}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando fichas...</div>
            ) : filteredFichas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No se encontraron fichas</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Terapia</TableHead>
                      <TableHead>Dosis</TableHead>
                      <TableHead>Inicio Trat.</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFichas.map((ficha) => {
                      const edad = ficha.paciente?.fecha_nacimiento
                        ? calcularEdad(ficha.paciente.fecha_nacimiento)
                        : null
                      return (
                        <TableRow key={ficha.id}>
                          <TableCell className="font-medium">{ficha.folio}</TableCell>
                          <TableCell>
                            <p className="font-medium">{formatearNombre(ficha.paciente)}</p>
                            {ficha.paciente?.telefono && (
                              <p className="text-sm text-muted-foreground">{ficha.paciente.telefono}</p>
                            )}
                          </TableCell>
                          <TableCell>{edad ? `${edad} años` : '-'}</TableCell>
                          <TableCell>
                            {ficha.doctor ? (
                              <span className="text-sm">{formatearNombre(ficha.doctor)}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{ficha.institucion?.nombre}</Badge>
                          </TableCell>
                          <TableCell>{ficha.diagnostico || '-'}</TableCell>
                          <TableCell>{ficha.terapia || '-'}</TableCell>
                          <TableCell>{ficha.dosis || '-'}</TableCell>
                          <TableCell>
                            {ficha.fecha_inicio_tratamiento
                              ? new Date(ficha.fecha_inicio_tratamiento).toLocaleDateString('es-MX')
                              : '-'}
                          </TableCell>
                          <TableCell>{new Date(ficha.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(ficha)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)}
                              >
                                Ver fechas
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
          </CardContent>
        </Card>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Cargando pacientes...
            </CardContent>
          </Card>
        ) : filteredFichas.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-medium mb-1">No hay pacientes</h3>
              <p className="text-sm">No se encontraron fichas para los filtros seleccionados</p>
            </CardContent>
          </Card>
        ) : (
          filteredFichas.map(ficha => {
            const edad = ficha.paciente?.fecha_nacimiento
              ? calcularEdad(ficha.paciente.fecha_nacimiento)
              : null

            return (
              <Collapsible key={ficha.id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CollapsibleTrigger className="w-full" onClick={() => toggleExpand(ficha.id)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 text-left space-y-2">
                          <div>
                            <h3 className="font-semibold text-base leading-tight">
                              {formatearNombre(ficha.paciente)}
                            </h3>
                            {edad && <p className="text-sm text-muted-foreground">{edad} años</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="secondary" className="text-xs">{ficha.institucion?.nombre}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>Folio: {ficha.folio}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {expandedItems.has(ficha.id)
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="border-t pt-4 space-y-3">
                        {ficha.paciente?.telefono && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{ficha.paciente.telefono}</span>
                          </div>
                        )}
                        {ficha.doctor && (
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="h-3 w-3 text-muted-foreground" />
                            <span>{formatearNombre(ficha.doctor)}</span>
                          </div>
                        )}
                        {ficha.diagnostico && (
                          <div>
                            <span className="text-sm font-medium">Diagnóstico:</span>
                            <p className="text-sm text-muted-foreground mt-1">{ficha.diagnostico}</p>
                          </div>
                        )}
                        {ficha.terapia && (
                          <div>
                            <span className="text-sm font-medium">Terapia:</span>
                            <p className="text-sm text-muted-foreground mt-1">{ficha.terapia}</p>
                          </div>
                        )}
                        {ficha.dosis && (
                          <div>
                            <span className="text-sm font-medium">Dosis:</span>
                            <p className="text-sm text-muted-foreground mt-1">{ficha.dosis}</p>
                          </div>
                        )}
                        {ficha.fecha_inicio_tratamiento && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Inicio: {new Date(ficha.fecha_inicio_tratamiento).toLocaleDateString('es-MX')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Registrado: {new Date(ficha.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleOpenEdit(ficha)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)}
                          >
                            Ver fechas
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })
        )}
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editingFicha} onOpenChange={(open) => { if (!open) handleCloseEdit() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ficha {editingFicha?.folio}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Doctor */}
            <div className="space-y-2">
              <Label>Doctor</Label>

              {!createNewMedico && (
                <Select
                  value={editForm.doctor_id || 'none'}
                  onValueChange={(v) => fieldEdit('doctor_id', v === 'none' ? '' : v)}
                  disabled={loadingMedicos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingMedicos ? 'Cargando...' : 'Sin doctor asignado'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin doctor asignado</SelectItem>
                    {medicosEdit.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {formatearNombreCompleto(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant={createNewMedico ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setCreateNewMedico(!createNewMedico)
                  if (!createNewMedico) fieldEdit('doctor_id', '')
                }}
              >
                {createNewMedico
                  ? <><X className="h-3 w-3 mr-1" /> Cancelar nuevo</>
                  : <><Plus className="h-3 w-3 mr-1" /> Nuevo médico</>}
              </Button>

              {createNewMedico && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre <span className="text-destructive">*</span></Label>
                    <Input
                      value={nuevoMedicoData.nombre}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apellido Paterno</Label>
                    <Input
                      value={nuevoMedicoData.apellido_pat || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Apellido Materno</Label>
                    <Input
                      value={nuevoMedicoData.apellido_mat || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={nuevoMedicoData.telefono || ''}
                      onChange={(e) => setNuevoMedicoData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Teléfono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Dosis e Inicio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Dosis <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.dosis}
                  onChange={(e) => fieldEdit('dosis', e.target.value)}
                  placeholder="Ej. 100mg cada 8h"
                  className={editErrors.dosis ? 'border-destructive' : ''}
                />
                {editErrors.dosis && <p className="text-xs text-destructive">{editErrors.dosis}</p>}
              </div>
              <div className="space-y-1">
                <Label>Inicio de Tratamiento <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={editForm.fecha_inicio_tratamiento}
                  onChange={(e) => fieldEdit('fecha_inicio_tratamiento', e.target.value)}
                  className={editErrors.fecha_inicio_tratamiento ? 'border-destructive' : ''}
                />
                {editErrors.fecha_inicio_tratamiento && (
                  <p className="text-xs text-destructive">{editErrors.fecha_inicio_tratamiento}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Diagnóstico</Label>
              <Textarea
                value={editForm.diagnostico}
                onChange={(e) => fieldEdit('diagnostico', e.target.value)}
                placeholder="Diagnóstico del paciente"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <Label>Terapia</Label>
              <Textarea
                value={editForm.terapia}
                onChange={(e) => fieldEdit('terapia', e.target.value)}
                placeholder="Terapia indicada"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCloseEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}