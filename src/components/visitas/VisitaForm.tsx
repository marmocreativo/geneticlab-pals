// components/visitas/VisitaForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building, Star } from 'lucide-react'
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
  const [busqueda, setBusqueda] = useState('')

  const { createVisita } = useVisitas()
  const { instituciones, fetchInstituciones } = useInstituciones()
  const { user } = useAuth()

  const form = useForm<VisitaFormData>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      fecha_visita: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
      hora_visita: '09:00',
    }
  })

  const selectedInstitucion = instituciones.find(i => i.id === form.watch('institucion_id'))

  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

  const institucionesFiltradas = [...instituciones]
    .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
    .filter(i =>
      busqueda === '' ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.direccion.toLowerCase().includes(busqueda.toLowerCase())
    )

  const handleSubmit = async (data: VisitaFormData) => {
    if (!user?.id) return

    setLoading(true)
    try {
      const offsetMinutes = new Date().getTimezoneOffset()
      const offsetSign = offsetMinutes <= 0 ? '+' : '-'
      const absOffset = Math.abs(offsetMinutes)
      const tzOffset = `${offsetSign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`

      const visitaData: VisitaInsert = {
        pal_id: user.id,
        institucion_id: data.institucion_id,
        fecha_visita: `${data.fecha_visita}T${data.hora_visita}:00${tzOffset}`,
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

  const handleNewInstitucionSuccess = (institucion: Institucion) => {
    form.setValue('institucion_id', institucion.id)
    setShowNewInstitucionForm(false)
    fetchInstituciones()
  }

  if (showNewInstitucionForm) {
    return (
      <InstitucionQuickForm
        onSuccess={handleNewInstitucionSuccess}
        onCancel={() => setShowNewInstitucionForm(false)}
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
                <Input type="date" className="h-9" {...field} />
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
                <Input type="time" className="h-9" {...field} />
              </FormControl>
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
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Buscar institución..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    {institucionesFiltradas.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No se encontraron instituciones
                      </div>
                    ) : (
                      institucionesFiltradas.map((institucion) => (
                        <SelectItem key={institucion.id} value={institucion.id}>
                          <div className="flex items-start gap-2 max-w-xs">
                            <Building className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-1">
                                {(institucion.visitas_count ?? 0) > promedioVisitas && (
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                                )}
                                {institucion.nombre}
                              </div>
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
                      <div className="font-medium flex items-center gap-1">
                        {(selectedInstitucion.visitas_count ?? 0) > promedioVisitas && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        )}
                        {selectedInstitucion.nombre}
                      </div>
                      <div className="text-xs text-muted-foreground">{selectedInstitucion.direccion}</div>
                    </div>
                  </div>
                )}

                {/* Botón nueva institución */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewInstitucionForm(true)}
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
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Programando...' : 'Programar Visita'}
          </Button>
        </div>
      </form>
    </Form>
  )
}