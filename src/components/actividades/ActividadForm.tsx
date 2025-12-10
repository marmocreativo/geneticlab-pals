// components/actividades/ActividadForm.tsx
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
import { Calendar, Clock, Building2, User, Package, FileText, StickyNote } from 'lucide-react'
import { format } from 'date-fns'
import type { ActividadInsert } from '@/types/actividad'

const actividadSchema = z.object({
  institucion_id: z.string().min(1, 'Selecciona una institución'),
  contacto_id: z.string().optional(),
  fecha_actividad: z.string().min(1, 'Selecciona una fecha'),
  hora_actividad: z.string().optional(),
  descripcion_actividad: z.string().optional(),
  temas_impartidos: z.string().optional(),
  entrega_sobres_id: z.string().optional(),
  entrega_kit_rash_id: z.string().optional(),
  notas: z.string().optional()
})

type ActividadFormData = z.infer<typeof actividadSchema>

interface ActividadFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ActividadInsert) => Promise<void>
  loading?: boolean
}

export function ActividadForm({ open, onOpenChange, onSubmit, loading = false }: ActividadFormProps) {
  const { user } = useAuth()
  const { instituciones, fetchInstituciones } = useInstituciones()
  const { contactos, fetchContactos } = useContactos()
  const { catalogos, refetch: refetchCatalogos } = useCatalogos() // Cambié fetchCatalogos por refetch

  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('')

  const form = useForm<ActividadFormData>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      institucion_id: '',
      contacto_id: '',
      fecha_actividad: format(new Date(), 'yyyy-MM-dd'),
      hora_actividad: '',
      descripcion_actividad: '',
      temas_impartidos: '',
      entrega_sobres_id: '',
      entrega_kit_rash_id: '',
      notas: ''
    }
  })

  // Cargar datos
  useEffect(() => {
    if (open) {
      fetchInstituciones()
      fetchContactos()
      refetchCatalogos() // Cambié por refetch
    }
  }, [open, fetchInstituciones, fetchContactos, refetchCatalogos])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSelectedInstitucion('')
    }
  }, [open, form])

  const handleSubmit = async (data: ActividadFormData) => {
    if (!user?.id) return

    const actividadData: ActividadInsert = {
      pal_id: user.id,
      institucion_id: data.institucion_id,
      contacto_id: data.contacto_id === 'none' ? undefined : data.contacto_id || undefined,
      fecha_actividad: data.fecha_actividad,
      hora_actividad: data.hora_actividad || undefined,
      descripcion_actividad: data.descripcion_actividad === 'none' ? undefined : data.descripcion_actividad || undefined,
      temas_impartidos: data.temas_impartidos === 'none' ? undefined : data.temas_impartidos || undefined,
      entrega_sobres_id: data.entrega_sobres_id === 'none' ? undefined : data.entrega_sobres_id || undefined,
      entrega_kit_rash_id: data.entrega_kit_rash_id === 'none' ? undefined : data.entrega_kit_rash_id || undefined,
      notas: data.notas || undefined
    }

    try {
      await onSubmit(actividadData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  // Filtrar catálogos
  const descripcionesActividad = catalogos.filter(c => c.tipo === 'descripcion_actividad' && c.activo)
  const temasImpartidos = catalogos.filter(c => c.tipo === 'temas_impartidos' && c.activo)
  const entregaSobres = catalogos.filter(c => c.tipo === 'entrega_sobres' && c.activo)
  const kitRash = catalogos.filter(c => c.tipo === 'kit_rash' && c.activo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Actividad
          </DialogTitle>
        </DialogHeader>

         <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Información básica */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Institución */}
                <FormField
                  control={form.control}
                  name="institucion_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        Institución
                      </FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedInstitucion(value)
                        }}
                      >
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

                {/* Contacto */}
                <FormField
                  control={form.control}
                  name="contacto_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Contacto (Opcional)
                      </FormLabel>
                      <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin contacto asignado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin contacto</SelectItem>
                          {contactos.map(contacto => (
                            <SelectItem key={contacto.id} value={contacto.id}>
                              <div>
                                <div className="font-medium">
                                  {[contacto.nombre, contacto.apellido_pat, contacto.apellido_mat]
                                    .filter(Boolean).join(' ')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {contacto.tipo_contacto}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fecha */}
                <FormField
                  control={form.control}
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

                {/* Hora */}
                <FormField
                  control={form.control}
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

            {/* Actividad - cambiar valores vacíos por "none" */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Detalles de la Actividad
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Descripción Actividad */}
                <FormField
                  control={form.control}
                  name="descripcion_actividad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de Actividad</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar actividad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          {descripcionesActividad.map(item => (
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

                {/* Temas Impartidos */}
                <FormField
                  control={form.control}
                  name="temas_impartidos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temas Impartidos</FormLabel>
                      <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin especificar</SelectItem>
                          {temasImpartidos.map(item => (
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

            {/* Entregas - cambiar valores vacíos por "none" */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Package className="h-4 w-4" />
                Material Entregado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entrega Sobres */}
                <FormField
                  control={form.control}
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

                {/* Kit Rash */}
                <FormField
                  control={form.control}
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
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <StickyNote className="h-4 w-4" />
                Notas Adicionales
              </h3>

              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales sobre la actividad..."
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

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Actividad'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}