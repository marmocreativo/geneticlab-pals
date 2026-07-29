// components/actividades/ActividadWizard.tsx
import { useState, useEffect, useRef } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Clock, Building2, User, Package, FileText, ArrowLeft, ArrowRight, Check, Plus, Star, ChevronDown, ChevronUp, Home } from 'lucide-react'
import { format } from 'date-fns'
import { ContactoQuickForm } from '@/components/contactos/ContactoQuickForm'
import type { ActividadInsert } from '@/types/actividad'
import type { Contacto } from '@/types/contacto'

const step1Schema = z.object({
  institucion_id: z.string().optional(),
  fecha_actividad: z.string().min(1, 'Selecciona una fecha'),
  hora_actividad: z.string().optional(),
  es_home_office: z.boolean(),
}).refine(
  (data) => data.es_home_office || (data.institucion_id && data.institucion_id.length > 0),
  { message: 'Selecciona una institución', path: ['institucion_id'] }
)

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
  const { catalogos: sectores } = useCatalogos('sector')
  const { catalogos: temasDisponibles } = useCatalogos('temas_impartidos')

  const [currentStep, setCurrentStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [contactSearchOpen, setContactSearchOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [showAddAnother, setShowAddAnother] = useState(false)
  const [contactosLoaded, setContactosLoaded] = useState(false)
  const [showNewContactoForm, setShowNewContactoForm] = useState(false)

  // Institución collapse
  const [institucionOpen, setInstitucionOpen] = useState(false)
  const busquedaInstitucionRef = useRef('')
  const estadoFiltroRef = useRef('')
  const ciudadFiltroRef = useRef('')
  const sectorFiltroRef = useRef('')
  const [busquedaActiva, setBusquedaActiva] = useState<{
    nombre: string
    estado: string
    ciudad: string
    sector: string
  }>({ nombre: '', estado: '', ciudad: '', sector: '' })
  const [mostrarAvanzada, setMostrarAvanzada] = useState(false)

  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

  const estadosUnicos = [...new Set(instituciones.map(i => i.estado).filter(Boolean))].sort()

  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i => {
      const matchNombre = busquedaActiva.nombre === '' ||
        i.nombre.toLowerCase().includes(busquedaActiva.nombre.toLowerCase()) ||
        i.direccion.toLowerCase().includes(busquedaActiva.nombre.toLowerCase())
      const matchEstado = busquedaActiva.estado === '' || i.estado === busquedaActiva.estado
      const matchCiudad = busquedaActiva.ciudad === '' ||
        (i.ciudad?.toLowerCase().includes(busquedaActiva.ciudad.toLowerCase()) ?? false)
      const matchSector = busquedaActiva.sector === '' || i.sector_id === busquedaActiva.sector
      return matchNombre && matchEstado && matchCiudad && matchSector
    })

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      institucion_id: '',
      fecha_actividad: format(new Date(), 'yyyy-MM-dd'),
      hora_actividad: '',
      es_home_office: false,
    }
  })

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      tipo_actividad: 'presencial',
      contacto_id: '',
      descripcion_actividad: '',
      temas_impartidos: '',
      entrega_sobres_id: '',
      entrega_kit_rash_id: '',
      notas: ''
    }
  })

  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setStep1Data(null)
      setShowAddAnother(false)
      setContactosLoaded(false)
      setShowNewContactoForm(false)
      setInstitucionOpen(false)
      step1Form.reset()
      step2Form.reset()
      setContactSearch('')
      busquedaInstitucionRef.current = ''
      estadoFiltroRef.current = ''
      ciudadFiltroRef.current = ''
      sectorFiltroRef.current = ''
      setBusquedaActiva({ nombre: '', estado: '', ciudad: '', sector: '' })
      setMostrarAvanzada(false)
    }
  }, [open])

  useEffect(() => {
    if (currentStep === 2 && !contactosLoaded) {
      fetchContactos()
      setContactosLoaded(true)
    }
  }, [currentStep, contactosLoaded, fetchContactos])

  const handleBuscar = () => {
    setBusquedaActiva({
      nombre: busquedaInstitucionRef.current,
      estado: estadoFiltroRef.current,
      ciudad: ciudadFiltroRef.current,
      sector: sectorFiltroRef.current
    })
  }

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  const submitRef = useRef(false)

  const handleStep2Submit = async (data: Step2Data) => {
    if (submitRef.current) return
    submitRef.current = true
    if (!user?.id || !step1Data) return
    const datosPaso1 = step1Data

    const actividadData: ActividadInsert = {
      pal_id: user.id,
      institucion_id: datosPaso1.es_home_office ? null : datosPaso1.institucion_id,
      fecha_actividad: datosPaso1.fecha_actividad,
      hora_actividad: datosPaso1.hora_actividad || undefined,
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
    } finally {
      submitRef.current = false
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

  const handleNewContactoSuccess = (contacto: Contacto) => {
    step2Form.setValue('contacto_id', contacto.id)
    setShowNewContactoForm(false)
    setContactSearchOpen(false)
    fetchContactos()
  }

  const filteredContactos = contactos
    .filter(contacto => {
      if (step1Data?.institucion_id && contacto.institucion_id !== step1Data.institucion_id) {
        return false
      }
      const fullName = `${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.toLowerCase()
      return fullName.includes(contactSearch.toLowerCase())
    })
    .reduce((unique, contacto) => {
      const fullName = `${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim()
      const isDuplicate = unique.some(item => {
        const itemFullName = `${item.nombre} ${item.apellido_pat || ''} ${item.apellido_mat || ''}`.trim()
        return itemFullName === fullName
      })
      if (!isDuplicate) unique.push(contacto)
      return unique
    }, [] as typeof contactos)

  const entregaSobres = catalogos.filter(c => c.tipo === 'entrega_sobres' && c.activo)
  const kitRash = catalogos.filter(c => c.tipo === 'kit_rash' && c.activo)

  const selectedInstitucion = instituciones.find(i => i.id === step1Data?.institucion_id)

  if (showNewContactoForm && step1Data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactoQuickForm
            institucionId={step1Data.institucion_id || undefined}
            onSuccess={handleNewContactoSuccess}
            onCancel={() => setShowNewContactoForm(false)}
          />
        </DialogContent>
      </Dialog>
    )
  }

  console.log('step1Data institucion_id:', step1Data?.institucion_id)
console.log('total contactos cargados:', contactos.length)
console.log('contactos kam/cuidador en el state:', contactos.filter(c => c.tipo_contacto === 'kam' || c.tipo_contacto === 'cuidador'))
console.log('filteredContactos:', JSON.stringify(filteredContactos.map(c => ({ nombre: c.nombre, tipo: c.tipo_contacto }))))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Actividad - Paso {currentStep} de 2
          </DialogTitle>
        </DialogHeader>

        {/* Paso 1 */}
        {currentStep === 1 && (
          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Información Básica
                </h3>

                <div className="space-y-4">

                  {/* Home Office */}
                  <FormField
                    control={step1Form.control}
                    name="es_home_office"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <FormLabel className="text-sm font-normal cursor-pointer">Home office</FormLabel>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.checked)
                              if (e.target.checked) {
                                step1Form.setValue('institucion_id', '')
                                setInstitucionOpen(false)
                              }
                            }}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Institución con collapse integrado */}
                  {!step1Form.watch('es_home_office') && (
                    <FormField
                      control={step1Form.control}
                      name="institucion_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            Institución
                          </FormLabel>

                          {/* Trigger del collapse */}
                          <button
                            type="button"
                            onClick={() => setInstitucionOpen(v => !v)}
                            className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm bg-background hover:bg-muted transition-colors"
                          >
                            <span className={field.value ? 'text-foreground' : 'text-muted-foreground'}>
                              {field.value
                                ? instituciones.find(i => i.id === field.value)?.nombre ?? 'Seleccionar institución'
                                : 'Seleccionar institución'}
                            </span>
                            {institucionOpen
                              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                          </button>

                          {/* Panel colapsable */}
                          {institucionOpen && (
                            <div className="border rounded-md overflow-hidden bg-background">

                              {/* Filtros */}
                              <div className="p-2 space-y-2 border-b bg-muted/30">
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Buscar por nombre..."
                                    defaultValue=""
                                    onChange={e => { busquedaInstitucionRef.current = e.target.value }}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
                                    className="h-8 text-sm flex-1"
                                  />
                                  <select
                                    defaultValue=""
                                    onChange={e => { estadoFiltroRef.current = e.target.value; handleBuscar() }}
                                    className="h-8 text-xs border rounded px-1 bg-background w-20 shrink-0"
                                  >
                                    <option value="">Estado</option>
                                    {estadosUnicos.map(estado => (
                                      <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                  </select>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 px-2 shrink-0 text-xs"
                                    onClick={handleBuscar}
                                  >
                                    Buscar
                                  </Button>
                                </div>

                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground hover:text-foreground w-full py-1 border rounded bg-background"
                                  onClick={() => setMostrarAvanzada(v => !v)}
                                >
                                  {mostrarAvanzada ? 'Ocultar filtros' : 'Búsqueda avanzada'}
                                </button>

                                {mostrarAvanzada && (
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="Ciudad..."
                                      defaultValue=""
                                      onChange={e => { ciudadFiltroRef.current = e.target.value }}
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
                                      className="h-8 text-xs flex-1"
                                    />
                                    <select
                                      defaultValue=""
                                      onChange={e => { sectorFiltroRef.current = e.target.value; handleBuscar() }}
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

                              {/* Lista de resultados — scroll nativo */}
                              <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                                {institucionesFiltradas.length === 0 ? (
                                  <p className="p-3 text-sm text-muted-foreground text-center">
                                    No se encontraron instituciones
                                  </p>
                                ) : (
                                  institucionesFiltradas.map(institucion => (
                                    <button
                                      key={institucion.id}
                                      type="button"
                                      className="w-full flex items-start gap-2 px-3 py-2 hover:bg-muted text-left border-b last:border-0 transition-colors"
                                      onClick={() => {
                                        field.onChange(institucion.id)
                                        setInstitucionOpen(false)
                                      }}
                                    >
                                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm flex items-center gap-1">
                                          {(institucion.visitas_count ?? 0) > promedioVisitas && (
                                            <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                                          )}
                                          <span className="truncate">{institucion.nombre}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          {institucion.direccion}
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {/* Institución seleccionada */}
                          {field.value && !institucionOpen && (() => {
                            const sel = instituciones.find(i => i.id === field.value)
                            return sel ? (
                              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{sel.nombre}</div>
                                </div>
                              </div>
                            ) : null
                          })()}

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Tipo de actividad */}
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={step1Form.control}
                      name="fecha_actividad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Fecha cuando realizaste la actividad
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

        {/* Paso 2 */}
        {currentStep === 2 && !showAddAnother && (
          <Form {...step2Form}>
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">

              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{selectedInstitucion?.nombre ?? 'Home office'}</p>
                <p className="text-sm text-muted-foreground">
                  {step1Data?.fecha_actividad} {step1Data?.hora_actividad && `a las ${step1Data.hora_actividad}`}
                </p>
              </div>

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
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                              {field.value
                                ? (() => {
                                    const selected = contactos.find(c => c.id === field.value)
                                    return selected
                                      ? `${selected.nombre} ${selected.apellido_pat || ''} ${selected.apellido_mat || ''}`.trim()
                                      : 'Sin contacto'
                                  })()
                                : 'Sin contacto'
                              }
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-lg p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Buscar contacto..."
                              value={contactSearch}
                              onValueChange={setContactSearch}
                            />
                            <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => { field.onChange(''); setContactSearchOpen(false) }}>
                                Sin contacto
                              </CommandItem>
                              {filteredContactos.map(contacto => (
                                <CommandItem
                                  key={contacto.id}
                                  value={`${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim()}
                                  onSelect={() => { field.onChange(contacto.id); setContactSearchOpen(false) }}
                                >
                                  <div>
                                    <div className="font-medium">
                                      {`${contacto.nombre} ${contacto.apellido_pat || ''} ${contacto.apellido_mat || ''}`.trim()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">{contacto.tipo_contacto}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewContactoForm(true)}
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

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Detalles de la Actividad
                </h3>

                <FormField
                  control={step2Form.control}
                  name="descripcion_actividad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de Actividad</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe las actividades realizadas..." className="resize-none" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step2Form.control}
                  name="temas_impartidos"
                  render={({ field }) => {
                    const seleccionados: string[] = field.value
                      ? field.value.split(',').map(t => t.trim()).filter(Boolean)
                      : []

                    const toggleTema = (nombre: string) => {
                      const nuevos = seleccionados.includes(nombre)
                        ? seleccionados.filter(t => t !== nombre)
                        : [...seleccionados, nombre]
                      field.onChange(nuevos.join(', '))
                    }

                    return (
                      <FormItem>
                        <FormLabel>Temas Impartidos</FormLabel>
                        <div className="border rounded-md overflow-y-auto" style={{ maxHeight: '180px' }}>
                          {temasDisponibles.length === 0 ? (
                            <p className="p-3 text-sm text-muted-foreground text-center">
                              No hay temas disponibles
                            </p>
                          ) : (
                            temasDisponibles.map(tema => (
                              <label
                                key={tema.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer border-b last:border-0"
                              >
                                <Checkbox
                                  checked={seleccionados.includes(tema.nombre)}
                                  onCheckedChange={() => toggleTema(tema.nombre)}
                                />
                                <span className="text-sm">{tema.nombre}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {seleccionados.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Seleccionados: {field.value}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

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
                              <SelectItem key={item.id} value={item.id}>{item.nombre}</SelectItem>
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
                              <SelectItem key={item.id} value={item.id}>{item.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={step2Form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observaciones adicionales..." className="resize-none" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={goBackToStep1}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : 'Guardar Actividad'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Éxito */}
        {showAddAnother && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Actividad guardada exitosamente</h3>
              <p className="text-muted-foreground">
                ¿Deseas agregar otra actividad para <strong>{selectedInstitucion?.nombre ?? 'Home office'}</strong>?
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleFinish}>Terminar</Button>
              <Button onClick={handleAddAnother}>Agregar Otra Actividad</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}