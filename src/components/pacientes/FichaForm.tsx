import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, X, Check, ChevronsUpDown, Building, Star } from 'lucide-react'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useContactos } from '@/hooks/useContactos'
import { useFichas } from '@/hooks/useFichas'
import { useAuth } from '@/contexts/AuthContext'
import { useCatalogos } from '@/hooks/useCatalogos'
import { contactosService } from '@/services/contactosService'
import type { ContactoInsert, Contacto } from '@/types/contacto'
import type { PeriodicidadFicha } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface FichaFormProps {
  onSuccess?: () => void
}

type Step = 'institucion' | 'paciente' | 'medico' | 'ficha'

const PERIODICIDAD_OPTIONS: { value: PeriodicidadFicha; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'cada_2_semanas', label: 'Cada 2 semanas' },
  { value: 'cada_3_semanas', label: 'Cada 3 semanas' },
  { value: 'cada_4_semanas', label: 'Cada 4 semanas' },
]

export default function FichaForm({ onSuccess }: FichaFormProps) {
  const { user } = useAuth()
  const { instituciones } = useInstituciones()
  const { createContacto } = useContactos()
  const { createFicha } = useFichas()
  const { catalogos: sectores } = useCatalogos('sector')

  const estadosUnicos = [...new Set(instituciones.map(i => i.estado).filter(Boolean))].sort()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('institucion')
  const [busquedaInstitucion, setBusquedaInstitucion] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [ciudadFiltro, setCiudadFiltro] = useState('')
  const [sectorFiltro, setSectorFiltro] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState<{
    nombre: string
    estado: string
    ciudad: string
    sector: string
  }>({ nombre: '', estado: '', ciudad: '', sector: '' })
  const [mostrarAvanzada, setMostrarAvanzada] = useState(false)

  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('')
  const [pacientesInstitucion, setPacientesInstitucion] = useState<Contacto[]>([])
  const [medicosInstitucion, setMedicosInstitucion] = useState<Contacto[]>([])
  const [loadingContactos, setLoadingContactos] = useState(false)
  

  // Paciente
  const [selectedPaciente, setSelectedPaciente] = useState<string>('')
  const [createNewPaciente, setCreateNewPaciente] = useState(false)
  const [openPacienteCombobox, setOpenPacienteCombobox] = useState(false)
  const [pacienteData, setPacienteData] = useState<ContactoInsert>({
    tipo_contacto: 'paciente',
    nombre: '',
    apellido_pat: '',
    apellido_mat: '',
    telefono: '',
    fecha_nacimiento: '',
    pal_id: user?.id || ''
  })

  // Médico
  const [selectedMedico, setSelectedMedico] = useState<string>('')
  const [createNewMedico, setCreateNewMedico] = useState(false)
  const [openMedicoCombobox, setOpenMedicoCombobox] = useState(false)
  const [medicoData, setMedicoData] = useState<ContactoInsert>({
    tipo_contacto: 'medico',
    nombre: '',
    apellido_pat: '',
    apellido_mat: '',
    telefono: '',
    pal_id: user?.id || ''
  })

  // Ficha
  const [fichaData, setFichaData] = useState({
    diagnostico: '',
    terapia: '',
    dosis: '',
    fecha_inicio_tratamiento: '',
    fecha_final_tratamiento: '',
    numero_pm: '',
    status: 'en_tx' as 'en_tx' | 'fuera_tx',
    periodicidad: '' as PeriodicidadFicha | '',
  })
  const [fichaErrors, setFichaErrors] = useState<{
    dosis?: string
    fecha_inicio_tratamiento?: string
  }>({})

  const handleBuscar = () => {
    setBusquedaActiva({
      nombre: busquedaInstitucion,
      estado: estadoFiltro,
      ciudad: ciudadFiltro,
      sector: sectorFiltro
    })
  }

  useEffect(() => {
    const loadContactos = async () => {
      if (!selectedInstitucion) return
      setLoadingContactos(true)
      try {
        const data = await contactosService.getContactosByInstitucion(selectedInstitucion)

        const uniqueByNombre = (list: Contacto[]) =>
          list.reduce((unique, c) => {
            const nombre = `${c.nombre} ${c.apellido_pat || ''} ${c.apellido_mat || ''}`.trim()
            if (!unique.some(u => `${u.nombre} ${u.apellido_pat || ''} ${u.apellido_mat || ''}`.trim() === nombre)) {
              unique.push(c)
            }
            return unique
          }, [] as Contacto[])

        setPacientesInstitucion(uniqueByNombre(data.filter(c => c.tipo_contacto === 'paciente')))
        setMedicosInstitucion(uniqueByNombre(data.filter(c => c.tipo_contacto === 'medico')))
      } catch {
        setPacientesInstitucion([])
        setMedicosInstitucion([])
      } finally {
        setLoadingContactos(false)
      }
    }
    loadContactos()
  }, [selectedInstitucion])

  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i => {
      const matchNombre = busquedaActiva.nombre === '' ||
        i.nombre.toLowerCase().includes(busquedaActiva.nombre.toLowerCase()) ||
        i.direccion.toLowerCase().includes(busquedaActiva.nombre.toLowerCase())
      const matchEstado = busquedaActiva.estado === '' || i.estado === busquedaActiva.estado
      const matchCiudad = busquedaActiva.ciudad === '' ||
        i.ciudad?.toLowerCase().includes(busquedaActiva.ciudad.toLowerCase())
      const matchSector = busquedaActiva.sector === '' || i.sector_id === busquedaActiva.sector
      return matchNombre && matchEstado && matchCiudad && matchSector
    })

  const selectedInstitucionData = instituciones.find(i => i.id === selectedInstitucion)
  const selectedPacienteData = pacientesInstitucion.find(c => c.id === selectedPaciente)
  const selectedMedicoData = medicosInstitucion.find(m => m.id === selectedMedico)

  const resetForm = () => {
    setStep('institucion')
    setSelectedInstitucion('')
    setBusquedaInstitucion('')
    setPacientesInstitucion([])
    setMedicosInstitucion([])
    setSelectedPaciente('')
    setCreateNewPaciente(false)
    setSelectedMedico('')
    setCreateNewMedico(false)
    setEstadoFiltro('')
    setCiudadFiltro('')
    setSectorFiltro('')
    setBusquedaActiva({ nombre: '', estado: '', ciudad: '', sector: '' })
    setMostrarAvanzada(false)
    setPacienteData({ tipo_contacto: 'paciente', nombre: '', apellido_pat: '', apellido_mat: '', telefono: '', fecha_nacimiento: '', pal_id: user?.id || '' })
    setMedicoData({ tipo_contacto: 'medico', nombre: '', apellido_pat: '', apellido_mat: '', telefono: '', pal_id: user?.id || '' })
    setFichaData({ diagnostico: '', terapia: '', dosis: '', fecha_inicio_tratamiento: '', fecha_final_tratamiento: '', numero_pm: '', status: 'en_tx', periodicidad: '' })
    setFichaErrors({})
  }

  const validateFicha = (): boolean => {
    const errors: typeof fichaErrors = {}
    if (!fichaData.dosis.trim()) errors.dosis = 'Requerido'
    if (!fichaData.fecha_inicio_tratamiento) errors.fecha_inicio_tratamiento = 'Requerido'
    setFichaErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateFicha()) return
    try {
      setLoading(true)

      let pacienteId = selectedPaciente
      if (createNewPaciente) {
        const nuevo = await createContacto({
          ...pacienteData,
          fecha_nacimiento: pacienteData.fecha_nacimiento || undefined,
          institucion_id: selectedInstitucion
        })
        pacienteId = nuevo.id
      }

      let medicoId: string | undefined = selectedMedico || undefined
      if (createNewMedico) {
        const nuevo = await createContacto({ ...medicoData, institucion_id: selectedInstitucion })
        medicoId = nuevo.id
      }

      await createFicha({
        institucion_id: selectedInstitucion,
        paciente_id: pacienteId,
        doctor_id: medicoId,
        diagnostico: fichaData.diagnostico || undefined,
        terapia: fichaData.terapia || undefined,
        dosis: fichaData.dosis,
        fecha_inicio_tratamiento: fichaData.fecha_inicio_tratamiento,
        fecha_final_tratamiento: fichaData.fecha_final_tratamiento || undefined,
        numero_pm: fichaData.numero_pm || undefined,
        status: fichaData.status,
        periodicidad: fichaData.periodicidad || undefined,
      })

      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch {
      // el hook ya muestra el toast
    } finally {
      setLoading(false)
    }
  }

  const formatNombre = (c: Contacto) => contactosService.formatearNombreCompleto(c)

  const resumen = (
    <div className="text-sm text-muted-foreground space-y-1">
      <p>Institución: <strong>{selectedInstitucionData?.nombre}</strong></p>
      {(selectedPaciente || createNewPaciente) && (
        <p>Paciente: <strong>
          {createNewPaciente
            ? `${pacienteData.nombre} ${pacienteData.apellido_pat || ''} ${pacienteData.apellido_mat || ''}`.trim()
            : selectedPacienteData ? formatNombre(selectedPacienteData) : ''}
        </strong></p>
      )}
      {(selectedMedico || createNewMedico) && step === 'ficha' && (
        <p>Médico: <strong>
          {createNewMedico
            ? `${medicoData.nombre} ${medicoData.apellido_pat || ''} ${medicoData.apellido_mat || ''}`.trim()
            : selectedMedicoData ? formatNombre(selectedMedicoData) : ''}
        </strong></p>
      )}
    </div>
  )

  const stepLabel: Record<Step, string> = {
    institucion: 'Seleccionar Institución',
    paciente: 'Seleccionar Paciente',
    medico: 'Seleccionar Médico',
    ficha: 'Datos de la Ficha',
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ficha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{stepLabel[step]}</DialogTitle>
        </DialogHeader>

        {/* PASO 1 - Institución */}
        {step === 'institucion' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Institución <span className="text-destructive">*</span></Label>
              <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <div className="p-2 border-b space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por nombre..."
                        value={busquedaInstitucion}
                        onChange={e => setBusquedaInstitucion(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation()
                          if (e.key === 'Enter') handleBuscar()
                        }}
                        className="h-8 text-sm min-w-0 flex-1"
                      />
                      <select
                        value={estadoFiltro}
                        onChange={e => setEstadoFiltro(e.target.value)}
                        className="h-8 text-xs border rounded px-1 bg-background w-20 shrink-0"
                      >
                        <option value="">Estado</option>
                        {estadosUnicos.map(estado => (
                          <option key={estado} value={estado}>{estado}</option>
                        ))}
                      </select>
                      <Button type="button" size="sm" className="h-8 px-2 shrink-0 text-xs" onClick={handleBuscar}>
                        Buscar
                      </Button>
                    </div>

                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground w-full py-2 border rounded flex items-center justify-center gap-1"
                      onClick={() => setMostrarAvanzada(v => !v)}
                    >
                      {mostrarAvanzada ? 'Ocultar filtros' : 'Búsqueda avanzada'}
                    </button>

                    {mostrarAvanzada && (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Ciudad..."
                          value={ciudadFiltro}
                          onChange={e => setCiudadFiltro(e.target.value)}
                          onKeyDown={e => e.stopPropagation()}
                          className="h-8 text-xs min-w-0 flex-1"
                        />
                        <select
                          value={sectorFiltro}
                          onChange={e => setSectorFiltro(e.target.value)}
                          className="h-8 text-xs border rounded px-1 bg-background w-24 shrink-0"
                        >
                          <option value="">Sector</option>
                          {sectores.map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {institucionesFiltradas.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No se encontraron instituciones
                    </div>
                  ) : (
                    institucionesFiltradas.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm flex items-center gap-1 truncate max-w-[300px]">
                              {(inst.visitas_count ?? 0) > promedioVisitas && (
                                <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                              )}
                              {inst.nombre}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {inst.direccion}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Preview institución seleccionada */}
              {selectedInstitucionData && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded text-sm mt-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-1">
                      {(selectedInstitucionData.visitas_count ?? 0) > promedioVisitas && (
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      )}
                      {selectedInstitucionData.nombre}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('paciente')} disabled={!selectedInstitucion}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2 - Paciente */}
        {step === 'paciente' && (
          <div className="space-y-6">
            {resumen}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paciente Existente</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={openPacienteCombobox} onOpenChange={setOpenPacienteCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={createNewPaciente}
                    >
                      {loadingContactos
                        ? 'Cargando...'
                        : selectedPacienteData ? formatNombre(selectedPacienteData) : 'Seleccionar paciente...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar paciente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                        <CommandGroup>
                          {pacientesInstitucion.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={formatNombre(p)}
                              onSelect={() => {
                                setSelectedPaciente(p.id === selectedPaciente ? '' : p.id)
                                setOpenPacienteCombobox(false)
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', selectedPaciente === p.id ? 'opacity-100' : 'opacity-0')} />
                              {formatNombre(p)}
                              {p.telefono && (
                                <span className="ml-auto text-sm text-muted-foreground">{p.telefono}</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <div className="text-center text-muted-foreground text-sm">— O —</div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Crear Nuevo Paciente
                  <Button
                    variant={createNewPaciente ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCreateNewPaciente(!createNewPaciente)
                      if (!createNewPaciente) setSelectedPaciente('')
                    }}
                  >
                    {createNewPaciente ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {createNewPaciente && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Nombre <span className="text-destructive">*</span></Label>
                      <Input
                        value={pacienteData.nombre}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Apellido Paterno</Label>
                      <Input
                        value={pacienteData.apellido_pat || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Apellido Materno</Label>
                      <Input
                        value={pacienteData.apellido_mat || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <Input
                        value={pacienteData.telefono || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha de Nacimiento</Label>
                      <Input
                        type="date"
                        value={pacienteData.fecha_nacimiento || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('institucion')}>Atrás</Button>
              <Button
                onClick={() => setStep('medico')}
                disabled={!createNewPaciente && !selectedPaciente}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* PASO 3 - Médico */}
        {step === 'medico' && (
          <div className="space-y-6">
            {resumen}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Médico Existente</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={openMedicoCombobox} onOpenChange={setOpenMedicoCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={createNewMedico}
                    >
                      {loadingContactos
                        ? 'Cargando...'
                        : selectedMedicoData ? formatNombre(selectedMedicoData) : 'Seleccionar médico...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar médico..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron médicos.</CommandEmpty>
                        <CommandGroup>
                          {medicosInstitucion.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={formatNombre(m)}
                              onSelect={() => {
                                setSelectedMedico(m.id === selectedMedico ? '' : m.id)
                                setOpenMedicoCombobox(false)
                              }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', selectedMedico === m.id ? 'opacity-100' : 'opacity-0')} />
                              {formatNombre(m)}
                              {m.telefono && (
                                <span className="ml-auto text-sm text-muted-foreground">{m.telefono}</span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <div className="text-center text-muted-foreground text-sm">— O —</div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Crear Nuevo Médico
                  <Button
                    variant={createNewMedico ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCreateNewMedico(!createNewMedico)
                      if (!createNewMedico) setSelectedMedico('')
                    }}
                  >
                    {createNewMedico ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {createNewMedico && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Nombre <span className="text-destructive">*</span></Label>
                      <Input
                        value={medicoData.nombre}
                        onChange={(e) => setMedicoData(prev => ({ ...prev, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Apellido Paterno</Label>
                      <Input
                        value={medicoData.apellido_pat || ''}
                        onChange={(e) => setMedicoData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Apellido Materno</Label>
                      <Input
                        value={medicoData.apellido_mat || ''}
                        onChange={(e) => setMedicoData(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <Input
                        value={medicoData.telefono || ''}
                        onChange={(e) => setMedicoData(prev => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('paciente')}>Atrás</Button>
              <Button onClick={() => setStep('ficha')}>
                {selectedMedico || createNewMedico ? 'Continuar' : 'Omitir'}
              </Button>
            </div>
          </div>
        )}

        {/* PASO 4 - Datos de la ficha */}
        {step === 'ficha' && (
          <div className="space-y-6">
            {resumen}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Dosis <span className="text-destructive">*</span></Label>
                  <Input
                    value={fichaData.dosis}
                    onChange={(e) => {
                      setFichaData(prev => ({ ...prev, dosis: e.target.value }))
                      if (fichaErrors.dosis) setFichaErrors(prev => ({ ...prev, dosis: undefined }))
                    }}
                    placeholder="Ej. 100mg"
                    className={fichaErrors.dosis ? 'border-destructive' : ''}
                  />
                  {fichaErrors.dosis && <p className="text-xs text-destructive">{fichaErrors.dosis}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Inicio de Tratamiento <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={fichaData.fecha_inicio_tratamiento}
                    onChange={(e) => {
                      setFichaData(prev => ({ ...prev, fecha_inicio_tratamiento: e.target.value }))
                      if (fichaErrors.fecha_inicio_tratamiento) setFichaErrors(prev => ({ ...prev, fecha_inicio_tratamiento: undefined }))
                    }}
                    className={fichaErrors.fecha_inicio_tratamiento ? 'border-destructive' : ''}
                  />
                  {fichaErrors.fecha_inicio_tratamiento && (
                    <p className="text-xs text-destructive">{fichaErrors.fecha_inicio_tratamiento}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fin de Tratamiento</Label>
                  <Input
                    type="date"
                    value={fichaData.fecha_final_tratamiento}
                    onChange={(e) => setFichaData(prev => ({ ...prev, fecha_final_tratamiento: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Periodicidad</Label>
                  <Select
                    value={fichaData.periodicidad || 'none'}
                    onValueChange={(v) => setFichaData(prev => ({ ...prev, periodicidad: v === 'none' ? '' : v as PeriodicidadFicha }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin especificar</SelectItem>
                      {PERIODICIDAD_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={fichaData.status}
                    onValueChange={(v) => setFichaData(prev => ({ ...prev, status: v as 'en_tx' | 'fuera_tx' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_tx">En Tx</SelectItem>
                      <SelectItem value="fuera_tx">Fuera Tx</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Número PM</Label>
                  <Input
                    value={fichaData.numero_pm}
                    onChange={(e) => setFichaData(prev => ({ ...prev, numero_pm: e.target.value }))}
                    placeholder="ID en CRM externo"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Diagnóstico</Label>
                <Textarea
                  value={fichaData.diagnostico}
                  onChange={(e) => setFichaData(prev => ({ ...prev, diagnostico: e.target.value }))}
                  placeholder="Descripción del diagnóstico..."
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label>Terapia (Opcional)</Label>
                <Textarea
                  value={fichaData.terapia}
                  onChange={(e) => setFichaData(prev => ({ ...prev, terapia: e.target.value }))}
                  placeholder="Descripción de la terapia..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('medico')}>Atrás</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creando...' : 'Crear Ficha'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}