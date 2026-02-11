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
import type { FichaPacienteInsert } from '@/types/ficha'
import type { ContactoInsert, Contacto } from '@/types/contacto'
import { cn } from '@/lib/utils'

interface FichaFormProps {
  onSuccess?: () => void
}

export default function FichaForm({ onSuccess }: FichaFormProps) {
  const { user } = useAuth()
  const { instituciones } = useInstituciones()
  const { createContacto } = useContactos()
  const { createFicha } = useFichas()
  
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'institucion' | 'paciente' | 'ficha'>('institucion')
  
  // Estados para institución
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('')
  
  // Estados para paciente
  const [contactosInstitucion, setContactosInstitucion] = useState<Contacto[]>([])
  const [selectedPaciente, setSelectedPaciente] = useState<string>('')
  const [createNewPaciente, setCreateNewPaciente] = useState(false)
  const [openCombobox, setOpenCombobox] = useState(false)

  // Datos del nuevo paciente
  const [pacienteData, setPacienteData] = useState<ContactoInsert>({
    tipo_contacto: 'paciente',
    nombre: '',
    apellido_pat: '',
    apellido_mat: '',
    telefono: '',
    fecha_nacimiento: '',
    pal_id: user?.id || ''
  })

  // Datos de la ficha
  const [fichaData, setFichaData] = useState<FichaPacienteInsert>({
    institucion_id: '',
    paciente_id: '',
    diagnostico: '',
    terapia: ''
  })

  // Cargar contactos cuando se selecciona institución
useEffect(() => {
  const loadContactosInstitucion = async () => {
    if (selectedInstitucion) {
      try {
        const contactos = await contactosService.getContactosByInstitucion(selectedInstitucion)
        const pacientes = contactos
          .filter(c => c.tipo_contacto === 'paciente')
          .reduce((unique, contacto) => {
            const fullName = `${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim()
            const isDuplicate = unique.some(item => {
              const itemFullName = `${item.nombre} ${item.apellido_pat || ''} ${item.apellido_mat || ''}`.trim()
              return itemFullName === fullName
            })
            if (!isDuplicate) {
              unique.push(contacto)
            }
            return unique
          }, [] as Contacto[])
        
        setContactosInstitucion(pacientes)
      } catch (error) {
        console.error('Error loading contactos:', error)
        setContactosInstitucion([])
      }
    }
  }

  loadContactosInstitucion()
}, [selectedInstitucion])

  const resetForm = () => {
    setStep('institucion')
    setSelectedInstitucion('')
    setSelectedPaciente('')
    setCreateNewPaciente(false)
    setContactosInstitucion([])
    setPacienteData({
      tipo_contacto: 'paciente',
      nombre: '',
      apellido_pat: '',
      apellido_mat: '',
      telefono: '',
      fecha_nacimiento: '',
      pal_id: user?.id || ''
    })
    setFichaData({
      institucion_id: '',
      paciente_id: '',
      diagnostico: '',
      terapia: ''
    })
  }

  const handleInstitucionNext = () => {
    if (selectedInstitucion) {
      setFichaData(prev => ({ ...prev, institucion_id: selectedInstitucion }))
      setPacienteData(prev => ({ ...prev, institucion_id: selectedInstitucion }))
      setStep('paciente')
    }
  }

  const handlePacienteNext = () => {
    if (createNewPaciente || selectedPaciente) {
      setStep('ficha')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      let pacienteId = selectedPaciente

      // Si se va a crear un nuevo paciente, crearlo primero
      if (createNewPaciente) {
        const newPaciente = await createContacto(pacienteData)
        pacienteId = newPaciente.id
      }

      // Crear la ficha
      const fichaToCreate = {
        ...fichaData,
        paciente_id: pacienteId
      }

      await createFicha(fichaToCreate)
      
      setOpen(false)
      resetForm()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating ficha:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatearNombreCompleto = (contacto: Contacto) => {
    return contactosService.formatearNombreCompleto(contacto)
  }

  const selectedPacienteData = contactosInstitucion.find(c => c.id === selectedPaciente)
  const selectedInstitucionData = instituciones.find(i => i.id === selectedInstitucion)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Ficha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'institucion' && 'Seleccionar Institución'}
            {step === 'paciente' && 'Seleccionar Paciente'}
            {step === 'ficha' && 'Datos de la Ficha'}
          </DialogTitle>
        </DialogHeader>

        {step === 'institucion' && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="institucion">Institución *</Label>
              <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map(institucion => (
                    <SelectItem key={institucion.id} value={institucion.id}>
                      {institucion.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleInstitucionNext} disabled={!selectedInstitucion}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'paciente' && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground mb-4">
              Institución: <strong>{selectedInstitucionData?.nombre}</strong>
            </div>

            {/* Selección de paciente existente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paciente Existente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Buscar paciente</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                        disabled={createNewPaciente}
                      >
                        {selectedPacienteData
                          ? formatearNombreCompleto(selectedPacienteData)
                          : "Seleccionar paciente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Buscar paciente..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron pacientes.</CommandEmpty>
                          <CommandGroup>
                            {contactosInstitucion.map((paciente) => (
                              <CommandItem
                                key={paciente.id}
                                value={formatearNombreCompleto(paciente)}
                                onSelect={() => {
                                  setSelectedPaciente(paciente.id === selectedPaciente ? "" : paciente.id)
                                  setOpenCombobox(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedPaciente === paciente.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {formatearNombreCompleto(paciente)}
                                {paciente.telefono && (
                                  <span className="ml-auto text-sm text-muted-foreground">
                                    {paciente.telefono}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <span className="text-muted-foreground">- O -</span>
            </div>

            {/* Crear nuevo paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Crear Nuevo Paciente
                  <Button
                    type="button"
                    variant={createNewPaciente ? "default" : "outline"}
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
                    <div>
                      <Label htmlFor="nombre">Nombre *</Label>
                      <Input
                        id="nombre"
                        value={pacienteData.nombre}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido_pat">Apellido Paterno</Label>
                      <Input
                        id="apellido_pat"
                        value={pacienteData.apellido_pat || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido_mat">Apellido Materno</Label>
                      <Input
                        id="apellido_mat"
                        value={pacienteData.apellido_mat || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, apellido_mat: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input
                        id="telefono"
                        value={pacienteData.telefono || ''}
                        onChange={(e) => setPacienteData(prev => ({ ...prev, telefono: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                      <Input
                        id="fecha_nacimiento"
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
              <Button variant="outline" onClick={() => setStep('institucion')}>
                Atrás
              </Button>
              <Button onClick={handlePacienteNext} disabled={!createNewPaciente && !selectedPaciente}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'ficha' && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Institución: <strong>{selectedInstitucionData?.nombre}</strong></div>
              <div>
                Paciente: <strong>
                  {createNewPaciente 
                    ? `${pacienteData.nombre} ${pacienteData.apellido_pat || ''} ${pacienteData.apellido_mat || ''}`.trim()
                    : selectedPacienteData ? formatearNombreCompleto(selectedPacienteData) : ''
                  }
                </strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="diagnostico">Diagnóstico</Label>
                <Textarea
                  id="diagnostico"
                  value={fichaData.diagnostico || ''}
                  onChange={(e) => setFichaData(prev => ({ ...prev, diagnostico: e.target.value }))}
                  placeholder="Descripción del diagnóstico..."
                />
              </div>

              <div>
                <Label htmlFor="terapia">Terapia</Label>
                <Textarea
                  id="terapia"
                  value={fichaData.terapia || ''}
                  onChange={(e) => setFichaData(prev => ({ ...prev, terapia: e.target.value }))}
                  placeholder="Descripción de la terapia..."
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('paciente')}>
                Atrás
              </Button>
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