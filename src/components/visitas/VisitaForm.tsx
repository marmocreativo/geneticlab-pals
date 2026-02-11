// components/visitas/VisitaForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Phone, Plus, Building } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'

import { useVisitas } from '@/hooks/useVisitas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useAuth } from '@/contexts/AuthContext'
import { InstitucionQuickForm } from '@/components/instituciones/InstitucionQuickForm'
import type { VisitaInsert } from '@/types/visita'
import type { Institucion } from '@/types/institucion'

const visitaSchema = z.object({
  institucion_id: z.string().min(1, 'Selecciona una institución'),
  fecha_visita: z.string().min(1, 'La fecha es requerida'),
  hora_visita: z.string().min(1, 'La hora es requerida'),
  tipo_visita: z.enum(['presencial', 'telefono'], {
    message: 'Selecciona el tipo de visita'
  })
})

type VisitaFormData = z.infer<typeof visitaSchema>

interface VisitaFormProps {
  defaultDate?: Date
  onSuccess?: () => void
  onCancel?: () => void
}

export default function VisitaForm({ defaultDate, onSuccess, onCancel }: VisitaFormProps) {
  const [loading, setLoading] = useState(false)
  const [showNewInstitucionForm, setShowNewInstitucionForm] = useState(false)

  const { createVisita } = useVisitas()
  const { instituciones, fetchInstituciones } = useInstituciones()
  const { user } = useAuth()

  const form = useForm<VisitaFormData>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      fecha_visita: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
      hora_visita: '09:00',
      tipo_visita: 'presencial'
    }
  })

  const selectedInstitucion = instituciones.find(i => i.id === form.watch('institucion_id'))

  const handleSubmit = async (data: VisitaFormData) => {
    if (!user?.id) return

    setLoading(true)
    try {
      const visitaData: VisitaInsert = {
        pal_id: user.id,
        institucion_id: data.institucion_id,
        fecha_visita: `${data.fecha_visita}T${data.hora_visita}:00`,
        estado: 'programada'
      }

      await createVisita(visitaData)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating visita:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewInstitucion = () => {
    setShowNewInstitucionForm(true)
  }

  const handleNewInstitucionSuccess = (institucion: Institucion) => {
    // Seleccionar automáticamente la nueva institución
    form.setValue('institucion_id', institucion.id)
    setShowNewInstitucionForm(false)
    // Refrescar la lista de instituciones
    fetchInstituciones()
  }

  const handleNewInstitucionCancel = () => {
    setShowNewInstitucionForm(false)
  }

  const getTipoVisitaBadge = (tipo: string) => {
    if (tipo === 'presencial') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <MapPin className="h-3 w-3 mr-1" />
          Presencial
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Phone className="h-3 w-3 mr-1" />
        Telefónica
      </Badge>
    )
  }

  // Si se está mostrando el formulario de nueva institución, renderizarlo
  if (showNewInstitucionForm) {
    return (
      <InstitucionQuickForm
        onSuccess={handleNewInstitucionSuccess}
        onCancel={handleNewInstitucionCancel}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Fecha */}
        <FormField
          control={form.control}
          name="fecha_visita"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Fecha</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="h-9"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hora */}
        <FormField
          control={form.control}
          name="hora_visita"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Hora</FormLabel>
              <FormControl>
                <Input
                  type="time"
                  className="h-9"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de visita */}
        <FormField
          control={form.control}
          name="tipo_visita"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Tipo de Visita</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="presencial">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>Presencial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="telefono">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>Telefónica</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Institución */}
        <FormField
          control={form.control}
          name="institucion_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Institución</FormLabel>
              <div className="space-y-3">
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecciona una institución" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {instituciones.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No hay instituciones registradas
                      </div>
                    ) : (
                      instituciones.map((institucion) => (
                        <SelectItem key={institucion.id} value={institucion.id}>
                          <div className="flex items-start gap-2 max-w-xs">
                            <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{institucion.nombre}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {institucion.direccion}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Institución seleccionada */}
                {selectedInstitucion && (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded text-sm">
                    <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{selectedInstitucion.nombre}</div>
                      <div className="text-xs text-muted-foreground">{selectedInstitucion.direccion}</div>
                    </div>
                    {getTipoVisitaBadge(form.watch('tipo_visita'))}
                  </div>
                )}

                {/* Botón para nueva institución */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNewInstitucion}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Agregar Nueva Institución
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones */}
        <div className="flex gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Programando...' : 'Programar Visita'}
          </Button>
        </div>
      </form>
    </Form>
  )
}