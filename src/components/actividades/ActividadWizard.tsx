// components/actividades/ActividadWizard.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useContactos } from '@/hooks/useContactos'
import { useCatalogos } from '@/hooks/useCatalogos'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar, Clock, Building2, User, Package, FileText, ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ContactoQuickForm } from '@/components/contactos/ContactoQuickForm'
import type { ActividadInsert } from '@/types/actividad'
import type { Contacto } from '@/types/contacto'

// Schema para paso 1
const step1Schema = z.object({
  institucion_id: z.string().min(1, 'Selecciona una institución'),
  fecha_actividad: z.string().min(1, 'Selecciona una fecha'),
  hora_actividad: z.string().optional()
})

// Schema para paso 2
const step2Schema = z.object({
  tipo_actividad: z.enum(['presencial', 'telefono']).refine((val) => val !== undefined, {
    message: 'Selecciona el tipo de actividad'
  }),
  contacto_id: z.string().optional(),
  descripcion_actividad: z.string().optional(),
  temas_impartidos: z.string().optional(),
  entrega_sobres_id: z.string().optional(),
  entrega_kit_rash_id: z.string().optional(),
  notas: z.string().optional()
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

interface ActividadWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ActividadInsert) => Promise<void>
  loading?: boolean
}

export function ActividadWizard({ open, onOpenChange, onSubmit, loading = false }: ActividadWizardProps) {
  const { user } = useAuth()
  const { instituciones } = useInstituciones()
  const { contactos, fetchContactos } = useContactos()
  const { catalogos } = useCatalogos()

  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [contactSearchOpen, setContactSearchOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [showAddAnother, setShowAddAnother] = useState(false)
  const [contactosLoaded, setContactosLoaded] = useState(false)
  const [showNewContactoForm, setShowNewContactoForm] = useState(false)

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      institucion_id: '',
      fecha_actividad: format(new Date(), 'yyyy-MM-dd'),
      hora_actividad: ''
    }
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      tipo_actividad: 'presencial', // Valor por defecto
      contacto_id: '',
      descripcion_actividad: '',
      temas_impartidos: '',
      entrega_sobres_id: '',
      entrega_kit_rash_id: '',
      notas: ''
    }
  })

  // Reset wizard when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setStep1Data(null)
      setShowAddAnother(false)
      setContactosLoaded(false)
      setShowNewContactoForm(false)
      step1Form.reset()
      step2Form.reset()
      setContactSearch('')
    }
  }, [open]) 

  // Cargar contactos solo una vez cuando se avanza al paso 2
  useEffect(() => {
    if (currentStep === 2 && !contactosLoaded) {
      fetchContactos()
      setContactosLoaded(true)
    }
  }, [currentStep, contactosLoaded, fetchContactos])

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const handleStep2Submit = async (data: Step2Data) => {
    if (!user?.id || !step1Data) return

    const actividadData: ActividadInsert = {
      pal_id: user.id,
      institucion_id: step1Data.institucion_id,
      fecha_actividad: step1Data.fecha_actividad,
      hora_actividad: step1Data.hora_actividad || undefined,
      tipo_actividad: data.tipo_actividad,
      contacto_id: data.contacto_id || undefined,
      descripcion_actividad: data.descripcion_actividad || undefined,
      temas_impartidos: data.temas_impartidos || undefined,
      entrega_sobres_id: data.entrega_sobres_id === 'none' ? undefined : data.entrega_sobres_id || undefined,
      entrega_kit_rash_id: data.entrega_kit_rash_id === 'none' ? undefined : data.entrega_kit_rash_id || undefined,
      notas: data.notas || undefined
    }

    try {
      await onSubmit(actividadData)
      setShowAddAnother(true)
    } catch (error) {
      console.error('Error submitting activity:', error)
    }
  }

  const handleAddAnother = () => {
    step2Form.reset()
    setCurrentStep(2)
    setShowAddAnother(false)
  }

  const handleFinish = () => {
    onOpenChange(false)
  }

  const goBackToStep1 = () => {
    setCurrentStep(1)
    setStep1Data(null)
  }

  const handleCreateNewContacto = () => {
    setShowNewContactoForm(true)
  }

  const handleNewContactoSuccess = (contacto: Contacto) => {
    // Seleccionar automáticamente el nuevo contacto
    step2Form.setValue('contacto_id', contacto.id)
    setShowNewContactoForm(false)
    setContactSearchOpen(false)
    // Refrescar la lista de contactos
    fetchContactos()
  }

  const handleNewContactoCancel = () => {
    setShowNewContactoForm(false)
  }

  // Filtrar contactos por búsqueda, institución y eliminar duplicados por nombre completo
  const filteredContactos = contactos
    .filter(contacto => {
      // Filtrar por institución seleccionada
      if (step1Data?.institucion_id && contacto.institucion_id !== step1Data.institucion_id) {
        return false
      }
      
      // Filtrar por búsqueda
      const fullName = `${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.toLowerCase()
      return fullName.includes(contactSearch.toLowerCase())
    })
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
    }, [] as typeof contactos)

  // Filtrar catálogos
  const entregaSobres = catalogos.filter(c => c.tipo === 'entrega_sobres' && c.activo)
  const kitRash = catalogos.filter(c => c.tipo === 'kit_rash' && c.activo)

  const selectedInstitucion = instituciones.find(i => i.id === step1Data?.institucion_id)

  // Si se está mostrando el formulario de nuevo contacto, renderizarlo
  if (showNewContactoForm && step1Data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactoQuickForm
            institucionId={step1Data.institucion_id}
            onSuccess={handleNewContactoSuccess}
            onCancel={handleNewContactoCancel}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Actividad - Paso {currentStep} de 2
          </DialogTitle>
        </DialogHeader>

        {/* Paso 1: Institución, Fecha, Hora */}
        {currentStep === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Información Básica
                </h3>
                
                <div className="space-y-4">
                  <FormField
                    control={step1Form.control}
                    name="institucion_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          Institución
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar institución" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instituciones.map(institucion => (
                              <SelectItem key={institucion.id} value={institucion.id}>
                                {institucion.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tipo de actividad */}
                  <div className="space-y-4">
                    <FormField
                      control={step2Form.control}
                      name="tipo_actividad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Tipo de Actividad
                          </FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="presencial">Presencial</SelectItem>
                              <SelectItem value="telefono">Telefónica</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={step1Form.control}
                      name="fecha_actividad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Fecha
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={step1Form.control}
                      name="hora_actividad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Hora (Opcional)
                          </FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Paso 2: Contacto y Detalles */}
        {currentStep === 2 && !showAddAnother && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
              
              {/* Info de la institución seleccionada */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{selectedInstitucion?.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {step1Data?.fecha_actividad} {step1Data?.hora_actividad && `a las ${step1Data.hora_actividad}`}
                </p>
              </div>

              {/* Contacto con búsqueda */}
              <div className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="contacto_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Contacto (Opcional)
                      </FormLabel>
                      <Popover open={contactSearchOpen} onOpenChange={setContactSearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {field.value 
                                ? (() => {
                                    const selected = contactos.find(c => c.id === field.value)
                                    return selected ? `${selected.nombre} ${selected.apellido_pat || ''} ${selected.apellido_mat || ''}`.trim() : 'Sin contacto'
                                  })()
                                : 'Sin contacto'
                              }
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar contacto..." 
                              value={contactSearch}
                              onValueChange={setContactSearch}
                            />
                            <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  field.onChange('')
                                  setContactSearchOpen(false)
                                }}
                              >
                                Sin contacto
                              </CommandItem>
                              {filteredContactos.map(contacto => (
                                <CommandItem
                                  key={contacto.id}
                                  onSelect={() => {
                                    field.onChange(contacto.id)
                                    setContactSearchOpen(false)
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">
                                      {`${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {contacto.tipo_contacto}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {/* Botón para nuevo contacto */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewContacto}
                        className="w-full h-8 text-xs mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar Nuevo Contacto
                      </Button>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Detalles de actividad */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Detalles de la Actividad
                </h3>

                <div className="space-y-4">
                  <FormField
                    control={step2Form.control}
                    name="descripcion_actividad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción de Actividad</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe las actividades realizadas..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="temas_impartidos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temas Impartidos</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Lista los temas educativos compartidos..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Material entregado */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  Material Entregado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={step2Form.control}
                    name="entrega_sobres_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entrega de Sobres</FormLabel>
                        <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="¿Se entregaron sobres?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin entrega</SelectItem>
                            {entregaSobres.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="entrega_kit_rash_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kit Rash</FormLabel>
                        <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="¿Se entregó kit?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin entrega</SelectItem>
                            {kitRash.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-4">
                <FormField
                  control={step2Form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observaciones adicionales..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={goBackToStep1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Actividad'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Paso 3: Agregar otra actividad */}
        {showAddAnother && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Actividad guardada exitosamente</h3>
              <p className="text-muted-foreground">
                ¿Deseas agregar otra actividad para <strong>{selectedInstitucion?.nombre}</strong>?
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleFinish}>
                Terminar
              </Button>
              <Button onClick={handleAddAnother}>
                Agregar Otra Actividad
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}