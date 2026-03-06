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
import { Plus, X, Check, ChevronsUpDown } from 'lucide-react'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useContactos } from '@/hooks/useContactos'
import { useFichas } from '@/hooks/useFichas'
import { useAuth } from '@/contexts/AuthContext'
import { contactosService } from '@/services/contactosService'
import type { ContactoInsert, Contacto } from '@/types/contacto'
import { cn } from '@/lib/utils'

interface FichaFormProps {
  onSuccess?: () => void
}

type Step = 'institucion' | 'paciente' | 'medico' | 'ficha'

export default function FichaForm({ onSuccess }: FichaFormProps) {
  const { user } = useAuth()
  const { instituciones } = useInstituciones()
  const { createContacto } = useContactos()
  const { createFicha } = useFichas()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('institucion')

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
  })
  const [fichaErrors, setFichaErrors] = useState<{ dosis?: string; fecha_inicio_tratamiento?: string }>({})

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

  const resetForm = () => {
    setStep('institucion')
    setSelectedInstitucion('')
    setPacientesInstitucion([])
    setMedicosInstitucion([])
    setSelectedPaciente('')
    setCreateNewPaciente(false)
    setSelectedMedico('')
    setCreateNewMedico(false)
    setPacienteData({ tipo_contacto: 'paciente', nombre: '', apellido_pat: '', apellido_mat: '', telefono: '', fecha_nacimiento: '', pal_id: user?.id || '' })
    setMedicoData({ tipo_contacto: 'medico', nombre: '', apellido_pat: '', apellido_mat: '', telefono: '', pal_id: user?.id || '' })
    setFichaData({ diagnostico: '', terapia: '', dosis: '', fecha_inicio_tratamiento: '' })
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
        const nuevo = await createContacto({ ...pacienteData, institucion_id: selectedInstitucion })
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

  const selectedInstitucionData = instituciones.find(i => i.id === selectedInstitucion)
  const selectedPacienteData = pacientesInstitucion.find(c => c.id === selectedPaciente)
  const selectedMedicoData = medicosInstitucion.find(m => m.id === selectedMedico)

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
          <div className="space-y-6">
            <div className="space-y-1">
              <Label>Institución <span className="text-destructive">*</span></Label>
              <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {/* Médico es opcional, se puede omitir */}
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
                    placeholder="Ej. 100mg cada 8h"
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
                <Label>Terapia</Label>
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