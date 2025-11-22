import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, User, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

import { useContactos } from '@/hooks/useContactos'
import { useCatalogos } from '@/hooks/useCatalogos'
import type { ActividadInsert } from '@/types/actividad'

const actividadSchema = z.object({
  contacto_id: z.string().min(1, 'Selecciona un contacto'),
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
  visitaId: string
  institucionId: string
}

export default function ActividadForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  visitaId, 
  institucionId 
}: ActividadFormProps) {
  const [loading, setLoading] = useState(false)
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const [newContactData, setNewContactData] = useState({
    nombre: '',
    apellido_pat: '',
    tipo_contacto: 'medico' as const
  })

  const { contactos, createContacto, formatearNombreCompleto } = useContactos()
  const { catalogos } = useCatalogos()

  // Filtrar catálogos por tipo
  const sobres = catalogos.filter(c => c.tipo === 'entrega_sobres' && c.activo)
  const kitsRash = catalogos.filter(c => c.tipo === 'kit_rash' && c.activo)

  // Filtrar contactos por institución
  const contactosInstitucion = contactos.filter(c => c.institucion_id === institucionId)

  const form = useForm<ActividadFormData>({
    resolver: zodResolver(actividadSchema),
    defaultValues: {
      descripcion_actividad: '',
      temas_impartidos: '',
      notas: ''
    }
  })

  const selectedContacto = contactosInstitucion.find(c => c.id === form.watch('contacto_id'))

  const handleSubmit = async (data: ActividadFormData) => {
    setLoading(true)
    try {
      const actividadData: ActividadInsert = {
        visita_id: visitaId,
        contacto_id: data.contacto_id,
        descripcion_actividad: data.descripcion_actividad || undefined,
        temas_impartidos: data.temas_impartidos || undefined,
        entrega_sobres_id: data.entrega_sobres_id || undefined,
        entrega_kit_rash_id: data.entrega_kit_rash_id || undefined,
        notas: data.notas || undefined
      }

      await onSubmit(actividadData)
      form.reset()
      setShowNewContactForm(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting actividad:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewContact = async () => {
    if (!newContactData.nombre.trim()) return

    try {
      setLoading(true)
      const newContacto = await createContacto({
        nombre: newContactData.nombre.trim(),
        apellido_pat: newContactData.apellido_pat.trim() || undefined,
        tipo_contacto: newContactData.tipo_contacto,
        institucion_id: institucionId
      })

      // Seleccionar el nuevo contacto automáticamente
      form.setValue('contacto_id', newContacto.id)
      
      // Resetear formulario de nuevo contacto
      setNewContactData({
        nombre: '',
        apellido_pat: '',
        tipo_contacto: 'medico'
      })
      setShowNewContactForm(false)
    } catch (error) {
      console.error('Error creating contact:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTipoContactoBadge = (tipo: string) => {
    const colors = {
      'medico': 'bg-blue-50 text-blue-700 border-blue-200',
      'paciente': 'bg-green-50 text-green-700 border-green-200',
      'familiar': 'bg-purple-50 text-purple-700 border-purple-200',
      'cuidador': 'bg-orange-50 text-orange-700 border-orange-200',
      'enfermera': 'bg-pink-50 text-pink-700 border-pink-200',
      'enfermero': 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
    
    return (
      <Badge variant="outline" className={colors[tipo as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'}>
        {tipo}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Nueva Actividad</DialogTitle>
          <DialogDescription className="text-sm">
            Registra una actividad realizada durante la visita
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Selección de contacto */}
            <FormField
              control={form.control}
              name="contacto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Contacto</FormLabel>
                  <div className="space-y-3">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecciona un contacto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactosInstitucion.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay contactos registrados para esta institución
                          </div>
                        ) : (
                          contactosInstitucion.map((contacto) => (
                            <SelectItem key={contacto.id} value={contacto.id}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{formatearNombreCompleto(contacto)}</span>
                                {getTipoContactoBadge(contacto.tipo_contacto)}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    {/* Contacto seleccionado */}
                    {selectedContacto && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{formatearNombreCompleto(selectedContacto)}</span>
                        {getTipoContactoBadge(selectedContacto.tipo_contacto)}
                      </div>
                    )}

                    {/* Opción para crear nuevo contacto */}
                    {!showNewContactForm ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewContactForm(true)}
                        className="w-full h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Crear Nuevo Contacto
                      </Button>
                    ) : (
                      <div className="border rounded p-3 space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-medium">Nuevo Contacto</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowNewContactForm(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-2 grid-cols-2">
                          <Input
                            placeholder="Nombre *"
                            value={newContactData.nombre}
                            onChange={(e) => setNewContactData(prev => ({ ...prev, nombre: e.target.value }))}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Apellido"
                            value={newContactData.apellido_pat}
                            onChange={(e) => setNewContactData(prev => ({ ...prev, apellido_pat: e.target.value }))}
                            className="h-8 text-xs"
                          />
                        </div>

                        <Select
                          value={newContactData.tipo_contacto}
                          onValueChange={(value: any) => setNewContactData(prev => ({ ...prev, tipo_contacto: value }))}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medico">Médico</SelectItem>
                            <SelectItem value="paciente">Paciente</SelectItem>
                            <SelectItem value="familiar">Familiar</SelectItem>
                            <SelectItem value="cuidador">Cuidador</SelectItem>
                            <SelectItem value="enfermera">Enfermera</SelectItem>
                            <SelectItem value="enfermero">Enfermero</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          onClick={handleCreateNewContact}
                          disabled={!newContactData.nombre.trim() || loading}
                          size="sm"
                          className="w-full h-7 text-xs"
                        >
                          Crear y Seleccionar
                        </Button>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción de actividad */}
            <FormField
              control={form.control}
              name="descripcion_actividad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Descripción de la Actividad</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las actividades realizadas..."
                      className="resize-none h-20 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Temas impartidos */}
            <FormField
              control={form.control}
              name="temas_impartidos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Temas Impartidos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Temas de educación o información compartidos..."
                      className="resize-none h-20 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entregas */}
            <div className="grid gap-3 grid-cols-2">
              <FormField
                control={form.control}
                name="entrega_sobres_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Sobres</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "sin-entrega" ? undefined : value)} 
                      value={field.value || "sin-entrega"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Sin entrega" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sin-entrega">Sin entrega</SelectItem>
                        {sobres.map((sobre) => (
                          <SelectItem key={sobre.id} value={sobre.id}>
                            {sobre.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entrega_kit_rash_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Kit Rash</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "sin-entrega" ? undefined : value)} 
                      value={field.value || "sin-entrega"}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Sin entrega" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sin-entrega">Sin entrega</SelectItem>
                        {kitsRash.map((kit) => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {kit.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      className="resize-none h-16 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm" className="h-8">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="h-8">
                {loading ? 'Registrando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}